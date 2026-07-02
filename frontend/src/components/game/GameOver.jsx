import { Link } from 'react-router-dom';

// End screen: win/lose/neutral message and a way back home.
function GameOver({ gameOver, myRole, lastResult }) {
    const message = gameOver?.abandoned
        ? 'Game abandoned.'
        : gameOver?.winnerRole === myRole
            ? '🎉 You win!'
            : gameOver?.winnerRole
                ? 'You lose.'
                : 'Game over.';

    return (
        <div style={{ textAlign: 'center' }}>
            <h2>{message}</h2>
            {lastResult?.answer && <p>Final flag: {lastResult.answer}</p>}
            <Link to="/"><button>Back to home</button></Link>
        </div>
    );
}

export default GameOver;
