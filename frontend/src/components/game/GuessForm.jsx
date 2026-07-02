// The guess input. Disabled briefly after a wrong guess (cooldown) or while the
// game is paused for an opponent reconnect.
function GuessForm({ guess, setGuess, onSubmit, cooldown, paused, opponentMissed, inputRef }) {
    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit();
    };

    const disabled = cooldown || paused;
    const placeholder = paused ? 'Paused…' : cooldown ? 'Wrong! Hang on…' : 'Type the country…';

    return (
        <form onSubmit={handleSubmit} style={{ textAlign: 'center' }}>
            <input
                ref={inputRef}
                type="text"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                autoComplete="off"
            />
            <button type="submit" disabled={disabled}>Guess</button>
            {opponentMissed && <span style={{ marginLeft: 8, color: '#999' }}>Opponent missed!</span>}
        </form>
    );
}

export default GuessForm;
