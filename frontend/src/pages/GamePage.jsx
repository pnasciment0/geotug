import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameConnection } from '../hooks/useGameConnection';
import { abandonGame, cancelGame } from '../utils/api';
import { PHASES, isPlayer, roleLabel, showsRope } from '../utils/constants';
import WaitingRoom from '../components/game/WaitingRoom';
import Lobby from '../components/game/Lobby';
import TugRope from '../components/game/TugRope';
import Countdown from '../components/game/Countdown';
import FlagBlanks from '../components/game/FlagBlanks';
import GuessForm from '../components/game/GuessForm';
import RoundResult from '../components/game/RoundResult';
import GameOver from '../components/game/GameOver';
import ConfirmDialog from '../components/ConfirmDialog';

function GamePage() {
    const { id: gameId } = useParams();
    const navigate = useNavigate();
    const game = useGameConnection(gameId);
    const { phase, role } = game;

    const [confirmLeave, setConfirmLeave] = useState(false);

    const handleLeave = async () => {
        setConfirmLeave(false);
        try {
            await abandonGame(gameId);
        } catch (error) {
            console.log('Error abandoning game:', error);
        } finally {
            navigate('/');
        }
    };

    // Backing out of the waiting room before anyone joins: nothing has happened
    // yet, so the server just discards the game and we return home.
    const handleCancelWaiting = async () => {
        try {
            await cancelGame(gameId);
        } catch (error) {
            console.log('Error cancelling game:', error);
        } finally {
            navigate('/');
        }
    };

    return (
        <>
            <h1>GeoTug</h1>

            {isPlayer(role) && <p style={{ color: '#666' }}>You are {roleLabel(role)}</p>}

            {phase === PHASES.NOT_FOUND && (
                <div style={{ textAlign: 'center' }}>
                    <p>This game isn’t available anymore.</p>
                    <p style={{ color: '#666' }}>
                        It may have been cancelled by the host, or the link is incorrect.
                    </p>
                    <button onClick={() => navigate('/')}>Back to home</button>
                </div>
            )}

            {phase === PHASES.WAITING && (
                <WaitingRoom gameId={gameId} onCancel={handleCancelWaiting} />
            )}

            {game.opponentLeft && (
                <p style={{ color: 'darkorange' }}>
                    Your opponent disconnected. Waiting for them to return…
                </p>
            )}

            {game.paused && (
                <div style={{ textAlign: 'center' }}>
                    <p style={{ color: 'darkorange', fontWeight: 'bold' }}>
                        ⏸ Opponent disconnected — game paused, waiting for them to reconnect…
                    </p>
                    {game.canLeave && (
                        <p>
                            They haven't come back. You can keep waiting, or{' '}
                            <button onClick={() => setConfirmLeave(true)}>leave the game</button>.
                        </p>
                    )}
                </div>
            )}

            {confirmLeave && (
                <ConfirmDialog
                    message="Leaving now will abandon the game for both players. Are you sure?"
                    confirmLabel="Leave game"
                    cancelLabel="Keep waiting"
                    onConfirm={handleLeave}
                    onCancel={() => setConfirmLeave(false)}
                />
            )}

            {phase === PHASES.LOBBY && !game.opponentLeft && (
                <Lobby
                    iAmReady={game.iAmReady}
                    opponentReady={game.opponentReady}
                    onReady={game.ready}
                    onUnready={game.unready}
                />
            )}

            {showsRope(phase) && <TugRope tugIndex={game.tugIndex} />}

            {phase === PHASES.COUNTDOWN && (
                <Countdown countdownLeft={game.countdownLeft} hasPrevResult={!!game.lastResult} />
            )}

            {/* While paused, hide the flag/blanks so the connected player can't
                study them while their opponent is disconnected. */}
            {phase === PHASES.PLAYING && !game.paused && (
                <>
                    <FlagBlanks flag={game.currentFlag} pattern={game.pattern} />
                    {isPlayer(role) ? (
                        <GuessForm
                            guess={game.guess}
                            setGuess={game.setGuess}
                            onSubmit={game.submitGuess}
                            cooldown={game.cooldown}
                            paused={game.paused}
                            opponentMissed={game.opponentMissed}
                            inputRef={game.inputRef}
                        />
                    ) : (
                        <p style={{ textAlign: 'center', color: '#999' }}>Spectating…</p>
                    )}
                </>
            )}

            {phase === PHASES.INTERMISSION && game.lastResult && (
                <RoundResult result={game.lastResult} myRole={role} />
            )}

            {phase === PHASES.OVER && (
                <GameOver gameOver={game.gameOver} myRole={role} lastResult={game.lastResult} />
            )}
        </>
    );
}

export default GamePage;
