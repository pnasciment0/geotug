 import { Link } from 'react-router-dom';
 import { socket } from '../utils/socket';
 import { useState } from 'react';
 import { apiCreate } from '../utils/api';
 import { useNavigate } from 'react-router-dom';

function CreateGame() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const playerId = crypto.randomUUID();

    const handleCreateGame = async () => {
        setLoading(true);
        try {
            const createdGame = await apiCreate('http://localhost:4000/api/games', { playerId });

            console.log(createdGame);

            if (createdGame.gameId) {
                // navigate(`/game/${createdGame.gameId}`, { state: { playerId } });
                navigate(`/game/${createdGame.gameId}?playerId=${playerId}&role=player1`);
            }
           
        } catch (error) {
            console.log('Create game error:', error);
        } finally {
            setLoading(false);
        }
    }

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
    )
}

export default CreateGame;