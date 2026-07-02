import crypto from 'crypto';
import prisma from '../prisma.js';
import { randomCountryFromDB } from '../../controllers/countries.js';
import { EVENTS, GAME_STATUS, ROLES } from '../constants.js';
import { resetReadiness, clearStarting } from './lobby.js';
import {
    normalize,
    buildAcceptedAnswers,
    buildPattern,
    letterIndices,
    computePull,
    HINT_INTERVAL_MS,
    ROUND_MAX_MS,
    PENALTY_MS,
    COUNTDOWN_MS,
    NEXT_ROUND_GAP_MS,
    ABANDON_MS,
} from '../guessing.js';

// In-memory round state + timers, keyed by gameId. The country *answer* lives
// only here on the server, so clients can never read it off the wire.
const roundsByGame = new Map();    // gameId -> round
const nextRoundTimers = new Map(); // gameId -> Timeout (pending next round)

// Presence + pause state for mid-game disconnect handling.
const connectedByGame = new Map(); // gameId -> Set(playerId) currently connected
const pausedByGame = new Map();    // gameId -> { pausedAt, resumeNextRound }
const abandonTimers = new Map();   // gameId -> Timeout (drop the game if nobody returns)

export const hasRound = (gameId) => roundsByGame.has(gameId);
const isPaused = (gameId) => pausedByGame.has(gameId);

function roomIsEmpty(io, gameId) {
    const room = io.sockets.adapter.rooms.get(gameId);
    return !room || room.size === 0;
}

function clearRoundTimers(gameId) {
    const round = roundsByGame.get(gameId);
    if (round) {
        if (round.hintTimer) clearInterval(round.hintTimer);
        if (round.maxTimer) clearTimeout(round.maxTimer);
        if (round.activateTimer) clearTimeout(round.activateTimer);
        round.hintTimer = round.maxTimer = round.activateTimer = null;
    }
}

function cleanupGame(gameId) {
    clearRoundTimers(gameId);
    roundsByGame.delete(gameId);
    resetReadiness(gameId);
    clearStarting(gameId);
    connectedByGame.delete(gameId);
    pausedByGame.delete(gameId);

    const nextTimer = nextRoundTimers.get(gameId);
    if (nextTimer) {
        clearTimeout(nextTimer);
        nextRoundTimers.delete(gameId);
    }
    const abandon = abandonTimers.get(gameId);
    if (abandon) {
        clearTimeout(abandon);
        abandonTimers.delete(gameId);
    }
}

// Snapshot a (re)connecting client needs to render the round already in flight.
export function getReconnectSnapshot(gameId) {
    const round = roundsByGame.get(gameId);
    if (!round || round.settled) return null;
    return {
        roundId: round.roundId,
        startsAt: round.startsAt,
        active: round.active,
        currentFlag: round.code,
        pattern: buildPattern(round.name, round.revealed),
        paused: isPaused(gameId),
    };
}

// Flip a round "live": reveal it, begin the answer clock, and start the hint +
// timeout timers. Shared by the first reveal and by resuming a paused countdown.
function activateRound(gameId, io) {
    const round = roundsByGame.get(gameId);
    if (!round) return;
    round.active = true;
    round.roundStartTime = Date.now();
    round.hintTimer = setInterval(() => revealHint(gameId, io), HINT_INTERVAL_MS);
    round.maxTimer = setTimeout(() => settleRound(gameId, io, null), ROUND_MAX_MS);
}

export async function beginRound(gameId, io, { first = false } = {}) {
    // Don't keep generating rounds for an empty room.
    if (roomIsEmpty(io, gameId)) {
        cleanupGame(gameId);
        return;
    }

    clearRoundTimers(gameId);

    const country = await randomCountryFromDB();
    const game = await prisma.game.update({
        where: { id: gameId },
        data: {
            currentFlag: country.code,
            status: GAME_STATUS.IN_PROGRESS,
            flagHistory: { push: country.code },
        },
    });

    const chars = [...country.name];
    const round = {
        roundId: crypto.randomUUID(),
        code: country.code,
        name: country.name,
        accepted: buildAcceptedAnswers(country.name),
        letterIdx: letterIndices(country.name),
        revealed: chars.map(() => false),
        hintsRevealed: 0,
        startsAt: Date.now() + COUNTDOWN_MS,
        roundStartTime: null,
        active: false,
        settled: false,
        paused: false,
        pausedAt: null,
        wrongAt: {}, // playerId -> timestamp of last wrong guess
        hintTimer: null,
        maxTimer: null,
        activateTimer: null,
    };
    roundsByGame.set(gameId, round);

    io.to(gameId).emit(EVENTS.ROUND_STARTING, {
        roundId: round.roundId,
        startsAt: round.startsAt,
        currentFlag: country.code,
        pattern: buildPattern(country.name, round.revealed),
        tugIndex: game.tugIndex,
        first,
    });

    // Activate exactly at countdown end.
    round.activateTimer = setTimeout(() => activateRound(gameId, io), Math.max(0, round.startsAt - Date.now()));
}

function revealHint(gameId, io) {
    const round = roundsByGame.get(gameId);
    if (!round || round.settled || !round.active) return;

    const hidden = round.letterIdx.filter((i) => !round.revealed[i]);
    // Always keep at least one letter hidden so the answer is never fully given.
    if (hidden.length <= 1) {
        if (round.hintTimer) {
            clearInterval(round.hintTimer);
            round.hintTimer = null;
        }
        return;
    }

    const idx = hidden[Math.floor(Math.random() * hidden.length)];
    round.revealed[idx] = true;
    round.hintsRevealed += 1;

    io.to(gameId).emit(EVENTS.HINT_REVEALED, {
        roundId: round.roundId,
        pattern: buildPattern(round.name, round.revealed),
        hintsRevealed: round.hintsRevealed,
    });
}

// Settle the current round. winnerRole === null means a draw (timed out).
async function settleRound(gameId, io, winnerRole) {
    const round = roundsByGame.get(gameId);
    if (!round || round.settled) return;
    round.settled = true; // claimed synchronously before any await
    clearRoundTimers(gameId);

    let pull = 0;
    if (winnerRole) {
        const timeMs = Date.now() - round.roundStartTime;
        pull = computePull({ timeMs, hints: round.hintsRevealed });
    }

    const game = await prisma.game.findUnique({ where: { id: gameId } });
    const signed = winnerRole === ROLES.PLAYER1 ? pull : winnerRole === ROLES.PLAYER2 ? -pull : 0;
    let newTug = Math.max(-3, Math.min(3, (game?.tugIndex ?? 0) + signed));
    newTug = Math.round(newTug * 100) / 100;

    const gameOver = newTug <= -3 || newTug >= 3;
    await prisma.game.update({
        where: { id: gameId },
        data: { tugIndex: newTug, status: gameOver ? GAME_STATUS.FINISHED : GAME_STATUS.IN_PROGRESS },
    });

    io.to(gameId).emit(EVENTS.ROUND_RESULT, {
        roundId: round.roundId,
        winnerRole,
        answer: round.name,
        flag: round.code,
        pull,
        tugIndex: newTug,
        gameOver,
        winner: gameOver ? winnerRole : null,
    });

    if (gameOver) {
        cleanupGame(gameId);
        return;
    }

    // Don't schedule the next round while paused; resume will handle it.
    if (isPaused(gameId)) {
        pausedByGame.get(gameId).resumeNextRound = true;
        return;
    }
    const timer = setTimeout(() => beginRound(gameId, io, { first: false }), NEXT_ROUND_GAP_MS);
    nextRoundTimers.set(gameId, timer);
}

// Handle a player's guess. Emits `guessResult` on a miss (with cooldown), or
// settles the round on a correct answer. The correctness check + claim are
// synchronous, so simultaneous correct guesses still resolve to one winner.
export async function submitGuess(gameId, io, { playerId, role, guess }) {
    if (isPaused(gameId)) return;

    const round = roundsByGame.get(gameId);
    if (!round || !round.active || round.settled) return;

    // Per-player wrong-guess cooldown (also enforced client-side).
    const last = round.wrongAt[playerId] || 0;
    if (Date.now() < last + PENALTY_MS) return;

    const normalized = normalize(guess);
    if (!normalized) return;

    if (!round.accepted.has(normalized)) {
        round.wrongAt[playerId] = Date.now();
        io.to(gameId).emit(EVENTS.GUESS_RESULT, { role, correct: false, penaltyMs: PENALTY_MS });
        return;
    }

    await settleRound(gameId, io, role);
}

// --- Presence / pause / resume ------------------------------------------

function scheduleAbandon(gameId) {
    const existing = abandonTimers.get(gameId);
    if (existing) clearTimeout(existing);
    abandonTimers.set(gameId, setTimeout(() => cleanupGame(gameId), ABANDON_MS));
}

function pauseGame(gameId, io) {
    if (isPaused(gameId)) return;

    const pauseInfo = { pausedAt: Date.now(), resumeNextRound: false };

    // If a next round was queued (we're in the between-rounds gap), cancel it
    // and remember to start it on resume.
    const nextTimer = nextRoundTimers.get(gameId);
    if (nextTimer) {
        clearTimeout(nextTimer);
        nextRoundTimers.delete(gameId);
        pauseInfo.resumeNextRound = true;
    }

    // Freeze the current round's timers (kept state resumes with adjusted time).
    const round = roundsByGame.get(gameId);
    if (round && !round.settled) {
        round.pausedAt = Date.now();
        clearRoundTimers(gameId);
    }

    pausedByGame.set(gameId, pauseInfo);
    io.to(gameId).emit(EVENTS.GAME_PAUSED, { reason: 'opponentDisconnected' });
}

function resumeGame(gameId, io) {
    const pauseInfo = pausedByGame.get(gameId);
    if (!pauseInfo) return;
    pausedByGame.delete(gameId);

    // Was queued for a fresh round when it paused → start it now.
    if (pauseInfo.resumeNextRound) {
        beginRound(gameId, io, { first: false });
        return;
    }

    const round = roundsByGame.get(gameId);
    if (!round || round.settled) return;

    const pauseDuration = Date.now() - (round.pausedAt || Date.now());
    round.pausedAt = null;

    if (round.active) {
        // Shift the answer clock forward so the pause doesn't count against pull.
        round.roundStartTime += pauseDuration;
        round.hintTimer = setInterval(() => revealHint(gameId, io), HINT_INTERVAL_MS);
        const remainingMax = Math.max(0, ROUND_MAX_MS - (Date.now() - round.roundStartTime));
        round.maxTimer = setTimeout(() => settleRound(gameId, io, null), remainingMax);

        io.to(gameId).emit(EVENTS.GAME_RESUMED, {
            active: true,
            roundId: round.roundId,
            currentFlag: round.code,
            pattern: buildPattern(round.name, round.revealed),
        });
    } else {
        // Still in the pre-reveal countdown: push the reveal back by the pause.
        round.startsAt += pauseDuration;
        round.activateTimer = setTimeout(() => activateRound(gameId, io), Math.max(0, round.startsAt - Date.now()));

        io.to(gameId).emit(EVENTS.GAME_RESUMED, {
            active: false,
            startsAt: round.startsAt,
            roundId: round.roundId,
            currentFlag: round.code,
            pattern: buildPattern(round.name, round.revealed),
        });
    }
}

export function playerConnected(gameId, io, playerId) {
    let set = connectedByGame.get(gameId);
    if (!set) {
        set = new Set();
        connectedByGame.set(gameId, set);
    }
    set.add(playerId);

    const abandon = abandonTimers.get(gameId);
    if (abandon) {
        clearTimeout(abandon);
        abandonTimers.delete(gameId);
    }

    // Both players present again → resume a paused game.
    if (isPaused(gameId) && set.size >= 2) {
        resumeGame(gameId, io);
    }
}

export function playerDisconnected(gameId, io, playerId) {
    const set = connectedByGame.get(gameId);
    if (set) set.delete(playerId);

    // Only meaningful once a game is underway.
    if (!roundsByGame.has(gameId)) return;

    if (set && set.size < 2 && !isPaused(gameId)) {
        pauseGame(gameId, io);
    }
    if (!set || set.size === 0) {
        scheduleAbandon(gameId);
    }
}
