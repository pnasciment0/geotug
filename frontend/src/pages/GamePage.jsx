import { useParams, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { socket } from '../utils/socket';
import { apiRead } from '../utils/api';

function GamePage() {
    const { id: gameId } = useParams();
    const [searchParams] = useSearchParams();

    const playerId = searchParams.get('playerId');
    const role = searchParams.get('role');

    const [player1Id, setPlayer1Id] = useState(null);
    const [player2Id, setPlayer2Id] = useState(null);
    const [currentFlag, setCurrentFlag] = useState(null);

    const gameLink = `${window.location.origin}/game/${gameId}`;

    useEffect(() => {
        const fetchGameData = async () => {
            try {
                const fetchedGame = await apiRead(`http://localhost:4000/api/games/${gameId}`);
                setPlayer1Id(fetchedGame.player1Id);
                setPlayer2Id(fetchedGame.player2Id);
                setCurrentFlag(fetchedGame.currentFlag);
            } catch (error) {
                console.log('Error fetching game data:', error);
            }
        }
        fetchGameData();
    }, [gameId]);

    useEffect(() => {
        if (!gameId || !playerId) return;

        socket.connect();
        socket.emit('joinGameRoom', { gameId, playerId, role });

        socket.on('playersUpdated', (game) => {
            setPlayer1Id(game.player1Id);
            setPlayer2Id(game.player2Id);
        });

        return () => {
            socket.off('playersUpdated');
            socket.disconnect();
        };
    }, [gameId, playerId, role]);

    return (
        <>
            <h1>GeoTug</h1>
            <div> Game join link: <a href={gameLink}>{gameLink}</a></div>
            <p style={{ fontWeight: playerId === player1Id ? 'bold' : 'normal' }}>
                Player 1 ID: {player1Id}{playerId === player1Id && ' (you)'}
            </p>
            <p style={{ fontWeight: playerId === player2Id ? 'bold' : 'normal' }}>
                Player 2 ID: {player2Id}{playerId === player2Id && ' (you)'}
            </p>
            <p>Current Flag: <img src={`https://flagcdn.com/w80/${currentFlag}.png`} alt={currentFlag} /></p>
        </>
    )
}

export default GamePage;