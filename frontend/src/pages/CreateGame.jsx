 import { Link } from 'react-router-dom';
 import { socket } from '../utils/socket';
 import { useState } from 'react';

function CreateGame() {
    const [loading, setLoading] = useState(false);
    const playerId = crypto.randomUUID();

    const handleCreateGame = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:4000/api/games', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerId })
            })

            const data = await res.json();
            console.log(data);

            if (data.gameId) {
                if (!socket.connected) socket.connect();

                socket.emit('joinGameRoom', { gameId: data.gameId, playerId });
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

export default CreateGame