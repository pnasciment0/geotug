// The 3-2-1 lead-in before a flag is revealed. Wording differs for the very
// first round vs. subsequent ones.
function Countdown({ countdownLeft, hasPrevResult }) {
    return (
        <h2 style={{ textAlign: 'center' }}>
            {hasPrevResult ? 'Next flag in ' : 'Starting in '}{countdownLeft}…
        </h2>
    );
}

export default Countdown;
