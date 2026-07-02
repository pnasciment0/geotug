import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { joinGame } from '../utils/api';
import { createPlayerId, storePlayerId } from '../utils/playerIdentity';

// Manual "paste an ID/link" fallback. The primary flow is clicking the invite
// link (handled by GamePage), but this lets someone join by ID too.
function JoinGame() {
    const navigate = useNavigate();
    const [gameURL, setGameURL] = useState('');
    const [error, setError] = useState('');

    const submitGameUrl = async (e) => {
        e.preventDefault();
        setError('');

        const gameId = gameURL.split('/game/').pop().split('?')[0].trim();
        if (!gameId) {
            setError('Please enter a valid game link or ID.');
            return;
        }

        const playerId = createPlayerId();
        const joinedGame = await joinGame(gameId, playerId);

        if (joinedGame.error) {
            console.log('Join error:', joinedGame.error);
            setError(joinedGame.error);
            return;
        }

        // Persist identity so GamePage recognizes us as Player 2 (link stays clean).
        storePlayerId(joinedGame.id, playerId);
        navigate(`/game/${joinedGame.id}`);
    };

    return (
        <>
            <h1>Join Private Game</h1>
            <input
                type="text"
                placeholder="Enter Game ID"
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
