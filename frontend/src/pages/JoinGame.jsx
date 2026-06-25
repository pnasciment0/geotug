import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiUpdate } from '../utils/api';

function JoinGame() {
    const navigate = useNavigate();
    const [gameURL, setGameURL] = useState('');
    const [error, setError] = useState('');
    const playerId = crypto.randomUUID();

    const submitGameUrl = async (e) => {
        e.preventDefault();
        setError('');

        const gameID = gameURL.split('/game/').pop().split('?')[0].trim();

        if (!gameID) {
            setError('Please enter a valid game link or ID.');
            return;
        }

        const joinedGame = await apiUpdate(`http://localhost:4000/api/games/join/${gameID}`, { playerId });

        if (joinedGame.error) {
            console.log('Join error:', joinedGame.error);
            setError(joinedGame.error);
            return;
        }

        navigate(`/game/${joinedGame.id}?playerId=${playerId}&role=player2`);
    }

    return (
        <>
            <h1>Join Private Game</h1>
            <input type="text" placeholder="Enter Game ID" value={gameURL} onChange={(e) => setGameURL(e.target.value)}/>
            <button onClick={submitGameUrl}>Join</button>
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </>
    )
}

export default JoinGame;