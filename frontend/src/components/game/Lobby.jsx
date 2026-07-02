// Ready-up lobby: both players present, waiting for both to ready before the
// first flag.
function Lobby({ iAmReady, opponentReady, onReady, onUnready }) {
    return (
        <div>
            <p>Both players are here. Ready up to start!</p>
            <button onClick={iAmReady ? onUnready : onReady}>
                {iAmReady ? 'Cancel ready' : "I'm ready"}
            </button>
            <p>
                You: {iAmReady ? 'Ready ✅' : 'Not ready'} · Opponent:{' '}
                {opponentReady ? 'Ready ✅' : 'Not ready'}
            </p>
        </div>
    );
}

export default Lobby;
