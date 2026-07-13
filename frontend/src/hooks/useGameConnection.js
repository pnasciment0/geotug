import { useEffect, useRef, useState } from 'react';
import { fetchGame, joinGame } from '../utils/api';
import { createPlayerId, getStoredPlayerId, storePlayerId } from '../utils/playerIdentity';
import { PHASES, ROLES, PAUSE_GRACE_MS } from '../utils/constants';
import {
    connectSocket,
    disconnectSocket,
    joinGameRoom,
    emitPlayerReady,
    emitPlayerUnready,
    emitSubmitGuess,
    subscribeToGameEvents,
} from '../utils/socket';
import {
    resumeAudio,
    playTick,
    playGo,
    playOpponentJoined,
    playCorrect,
    playWrong,
} from '../utils/sound';

// Encapsulates the whole client-side game lifecycle: identity resolution,
// realtime wiring, the synced countdown, and sounds. GamePage stays purely
// presentational and just reads the returned state / calls the actions.
export function useGameConnection(gameId) {
    const [playerId, setPlayerId] = useState(null);
    const [role, setRole] = useState(null);
    const [player1Id, setPlayer1Id] = useState(null);
    const [player2Id, setPlayer2Id] = useState(null);

    const [phase, setPhase] = useState(PHASES.LOADING);
    const [readiness, setReadiness] = useState({ player1: false, player2: false });
    const [opponentLeft, setOpponentLeft] = useState(false);
    const [paused, setPaused] = useState(false);
    const [canLeave, setCanLeave] = useState(false);

    const [currentFlag, setCurrentFlag] = useState(null);
    const [roundId, setRoundId] = useState(null);
    const [pattern, setPattern] = useState([]);
    const [startsAt, setStartsAt] = useState(null);
    const [countdownLeft, setCountdownLeft] = useState(null);
    const [tugIndex, setTugIndex] = useState(0);
    const [guess, setGuess] = useState('');
    const [cooldown, setCooldown] = useState(false);
    const [opponentMissed, setOpponentMissed] = useState(false);
    const [lastResult, setLastResult] = useState(null);
    const [gameOver, setGameOver] = useState(null);

    const joinAttempted = useRef(false);
    const prevPlayer2 = useRef(null);
    const cooldownTimer = useRef(null);
    const missTimer = useRef(null);
    const inputRef = useRef(null);

    const isPlayer = role === ROLES.PLAYER1 || role === ROLES.PLAYER2;

    // 1) Resolve identity, auto-joining as Player 2 when there's an open slot.
    useEffect(() => {
        if (!gameId) return;
        let cancelled = false;

        const resolveIdentity = async () => {
            try {
                const game = await fetchGame(gameId);
                if (cancelled) return;
                if (game.error) {
                    console.log('Error fetching game data:', game.error);
                    // Link points to a game that was cancelled or never existed.
                    setRole(ROLES.SPECTATOR);
                    setPhase(PHASES.NOT_FOUND);
                    return;
                }

                setPlayer1Id(game.player1Id);
                setPlayer2Id(game.player2Id);
                setCurrentFlag(game.currentFlag);
                setTugIndex(game.tugIndex ?? 0);

                const storedId = getStoredPlayerId(gameId);
                let resolvedRole = ROLES.SPECTATOR;

                if (storedId && storedId === game.player1Id) {
                    resolvedRole = ROLES.PLAYER1;
                } else if (storedId && storedId === game.player2Id) {
                    resolvedRole = ROLES.PLAYER2;
                } else if (game.status === 'waiting' && !game.player2Id) {
                    if (joinAttempted.current) return;
                    joinAttempted.current = true;

                    const newPlayerId = createPlayerId();
                    const joinedGame = await joinGame(gameId, newPlayerId);
                    if (cancelled) return;
                    if (joinedGame.error) {
                        console.log('Join error:', joinedGame.error);
                        setRole(ROLES.SPECTATOR);
                        setPhase(PHASES.OVER);
                        return;
                    }
                    storePlayerId(gameId, newPlayerId);
                    setPlayerId(newPlayerId);
                    setRole(ROLES.PLAYER2);
                    setPlayer1Id(joinedGame.player1Id);
                    setPlayer2Id(joinedGame.player2Id);
                    setPhase(PHASES.LOBBY);
                    return;
                }

                setRole(resolvedRole);
                setPlayerId(storedId);

                if (game.status === 'finished') {
                    setGameOver({ winnerRole: game.tugIndex >= 3 ? ROLES.PLAYER1 : ROLES.PLAYER2 });
                    setPhase(PHASES.OVER);
                } else if (game.status === 'abandoned') {
                    setGameOver({ winnerRole: null, abandoned: true });
                    setPhase(PHASES.OVER);
                } else if (game.status === 'in_progress') {
                    setPhase(PHASES.PLAYING); // refined by roundSnapshot once wired
                } else if (resolvedRole !== ROLES.SPECTATOR && game.player2Id) {
                    setPhase(PHASES.LOBBY);
                } else if (resolvedRole !== ROLES.SPECTATOR) {
                    setPhase(PHASES.WAITING);
                } else {
                    setPhase(PHASES.OVER);
                }
            } catch (error) {
                console.log('Error resolving identity:', error);
            }
        };

        resolveIdentity();
        return () => {
            cancelled = true;
        };
    }, [gameId]);

    // 2) Join the realtime room and wire up game events.
    useEffect(() => {
        if (!gameId || !playerId || !role || role === ROLES.SPECTATOR) return;

        connectSocket();
        joinGameRoom({ gameId, playerId, role });

        const applyRound = ({ roundId: rId, currentFlag: flag, pattern: pat, tugIndex: tug }) => {
            setRoundId(rId);
            if (flag) setCurrentFlag(flag);
            setPattern(pat || []);
            if (typeof tug === 'number') setTugIndex(tug);
        };

        const unsubscribe = subscribeToGameEvents({
            onPlayersUpdated: (game) => {
                setPlayer1Id(game.player1Id);
                setPlayer2Id(game.player2Id);
                setOpponentLeft(false);
                // Player 1 is waiting when Player 2 joins → move into the lobby.
                if (game.player1Id && game.player2Id) {
                    setPhase((cur) => (cur === PHASES.WAITING ? PHASES.LOBBY : cur));
                }
            },
            onReadinessUpdated: (r) => setReadiness(r),
            onRoundStarting: ({ roundId: rId, startsAt: at, currentFlag: flag, pattern: pat, tugIndex: tug }) => {
                applyRound({ roundId: rId, currentFlag: flag, pattern: pat, tugIndex: tug });
                setStartsAt(at);
                setLastResult(null);
                setGuess('');
                setCooldown(false);
                setPaused(false);
                setPhase(PHASES.COUNTDOWN);
            },
            onRoundSnapshot: ({ roundId: rId, startsAt: at, active, currentFlag: flag, pattern: pat, tugIndex: tug, paused: isPausedNow }) => {
                applyRound({ roundId: rId, currentFlag: flag, pattern: pat, tugIndex: tug });
                setPaused(!!isPausedNow);
                if (active) {
                    setStartsAt(null);
                    setPhase(PHASES.PLAYING);
                } else {
                    setStartsAt(at);
                    setPhase(PHASES.COUNTDOWN);
                }
            },
            onHintRevealed: ({ roundId: rId, pattern: pat }) => {
                setRoundId((cur) => {
                    if (cur === rId) setPattern(pat);
                    return cur;
                });
            },
            onGuessResult: ({ role: guesserRole, correct, penaltyMs }) => {
                if (correct) return; // correct guesses arrive via roundResult
                if (guesserRole === role) {
                    playWrong();
                    setCooldown(true);
                    if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
                    cooldownTimer.current = setTimeout(() => setCooldown(false), penaltyMs || 1000);
                } else {
                    setOpponentMissed(true);
                    if (missTimer.current) clearTimeout(missTimer.current);
                    missTimer.current = setTimeout(() => setOpponentMissed(false), 1200);
                }
            },
            onRoundResult: (res) => {
                setTugIndex(res.tugIndex);
                setLastResult({ winnerRole: res.winnerRole, answer: res.answer, pull: res.pull, flag: res.flag });
                setStartsAt(null);
                setCooldown(false);

                if (res.winnerRole === role) playCorrect();
                else if (res.winnerRole) playWrong();

                if (res.gameOver) {
                    setGameOver({ winnerRole: res.winner });
                    setPhase(PHASES.OVER);
                } else {
                    setPhase(PHASES.INTERMISSION);
                }
            },
            onOpponentLeft: () => {
                setPhase((cur) => {
                    if (cur === PHASES.LOBBY || cur === PHASES.WAITING || cur === PHASES.COUNTDOWN) {
                        setStartsAt(null);
                        setReadiness({ player1: false, player2: false });
                        setOpponentLeft(true);
                        return PHASES.LOBBY;
                    }
                    return cur;
                });
            },
            onGamePaused: () => setPaused(true),
            onGameResumed: ({ active, startsAt: at, currentFlag: flag, pattern: pat }) => {
                if (flag) setCurrentFlag(flag);
                if (pat) setPattern(pat);
                setPaused(false);
                if (active) {
                    setStartsAt(null);
                    setPhase(PHASES.PLAYING);
                } else {
                    setStartsAt(at);
                    setPhase(PHASES.COUNTDOWN);
                }
            },
        });

        return () => {
            unsubscribe();
            disconnectSocket();
        };
    }, [gameId, playerId, role]);

    // 3) Synced 3-2-1 countdown against the shared server `startsAt`.
    useEffect(() => {
        if (phase !== PHASES.COUNTDOWN || !startsAt || paused) return;

        let lastShown = null;
        const tick = () => {
            const msLeft = startsAt - Date.now();
            if (msLeft <= 0) {
                setCountdownLeft(0);
                setPhase(PHASES.PLAYING);
                playGo();
                return true;
            }
            const secs = Math.ceil(msLeft / 1000);
            setCountdownLeft(secs);
            if (secs !== lastShown) {
                lastShown = secs;
                playTick();
            }
            return false;
        };

        if (tick()) return;
        const interval = setInterval(() => {
            if (tick()) clearInterval(interval);
        }, 100);
        return () => clearInterval(interval);
    }, [phase, startsAt, paused]);

    // Focus the guess box when a round becomes playable.
    useEffect(() => {
        if (phase === PHASES.PLAYING && isPlayer && inputRef.current) {
            inputRef.current.focus();
        }
    }, [phase, isPlayer]);

    // After a pause lingers past the grace period, assume the opponent may be
    // gone for good and let the remaining player choose to leave.
    useEffect(() => {
        if (!paused) {
            setCanLeave(false);
            return;
        }
        const timer = setTimeout(() => setCanLeave(true), PAUSE_GRACE_MS);
        return () => clearTimeout(timer);
    }, [paused]);

    // Player 1 hears a soft chime the moment Player 2 arrives.
    useEffect(() => {
        if (role === ROLES.PLAYER1 && !prevPlayer2.current && player2Id) {
            playOpponentJoined();
        }
        prevPlayer2.current = player2Id;
    }, [player2Id, role]);

    // Clean up any pending UI timers on unmount.
    useEffect(() => () => {
        if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
        if (missTimer.current) clearTimeout(missTimer.current);
    }, []);

    // --- Actions ---------------------------------------------------------
    const ready = () => {
        resumeAudio();
        emitPlayerReady({ gameId, role });
    };
    const unready = () => emitPlayerUnready({ gameId, role });

    const submitGuess = () => {
        const value = guess.trim();
        if (!value || cooldown || paused || phase !== PHASES.PLAYING || !isPlayer) return;
        resumeAudio();
        emitSubmitGuess({ gameId, playerId, role, guess: value });
        setGuess('');
    };

    return {
        role,
        isPlayer,
        phase,
        player1Id,
        player2Id,
        iAmReady: role === ROLES.PLAYER1 ? readiness.player1 : readiness.player2,
        opponentReady: role === ROLES.PLAYER1 ? readiness.player2 : readiness.player1,
        opponentLeft,
        paused,
        canLeave,
        currentFlag,
        pattern,
        countdownLeft,
        tugIndex,
        guess,
        setGuess,
        cooldown,
        opponentMissed,
        lastResult,
        gameOver,
        inputRef,
        ready,
        unready,
        submitGuess,
    };
}
