import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { createGame } from '../utils/api';
import { createPlayerId, storePlayerId } from '../utils/playerIdentity';

function CreateGame() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleCreateGame = async () => {
        setLoading(true);
        try {
            const playerId = createPlayerId();
            const createdGame = await createGame(playerId);

            if (createdGame.gameId) {
                // Persist identity on the device so the shared link stays clean.
                storePlayerId(createdGame.gameId, playerId);
                navigate(`/game/${createdGame.gameId}`);
            }
        } catch (error) {
            console.log('Create game error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <h1>Create Game Page</h1>
            <button onClick={handleCreateGame} disabled={loading}>
                {loading ? 'Creating Game...' : 'Start Game'}
            </button>
            <Link to="/">
                <button>Cancel</button>
            </Link>
        </>
    );
}

export default CreateGame;
