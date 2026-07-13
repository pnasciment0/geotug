import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { joinGame } from '../utils/api';
import { createPlayerId, storePlayerId } from '../utils/playerIdentity';

// Fallback path for when opening the link directly isn't possible (link arrived
// as plain text, joining from another device, etc.). The primary flow is just
// opening the invite link (auto-joins via GamePage). The parser below also
// tolerates a bare game ID, but we prompt for the link since it's what we share.
function JoinGame() {
    const navigate = useNavigate();
    const [gameURL, setGameURL] = useState('');
    const [error, setError] = useState('');

    const submitGameUrl = async (e) => {
        e.preventDefault();
        setError('');

        const gameId = gameURL.split('/game/').pop().split('?')[0].trim();
        if (!gameId) {
            setError('Please paste the game link your friend sent you.');
            return;
        }

        const playerId = createPlayerId();
        const joinedGame = await joinGame(gameId, playerId);

        if (joinedGame.error) {
            console.log('Join error:', joinedGame.error);
            // A cancelled/expired link 404s on the server; show friendly copy
            // instead of the raw "Game not found".
            setError(
                joinedGame.error === 'Game not found'
                    ? 'This game isn’t available anymore. It may have been cancelled, or the link is incorrect.'
                    : joinedGame.error
            );
            return;
        }

        // Persist identity so GamePage recognizes us as Player 2 (link stays clean).
        storePlayerId(joinedGame.id, playerId);
        navigate(`/game/${joinedGame.id}`);
    };

    return (
        <>
            <h1>Join Private Game</h1>
            <p>Paste the game link your friend sent you.</p>
            <input
                type="text"
                placeholder="Paste game link"
                value={gameURL}
                onChange={(e) => setGameURL(e.target.value)}
            />
            <button onClick={submitGameUrl}>Join</button>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <button onClick={() => navigate('/')}>Cancel</button>
        </>
    );
}

export default JoinGame;
