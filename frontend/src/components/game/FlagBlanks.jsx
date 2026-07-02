import { flagUrl, patternCell } from '../../utils/flags';

// The flag to guess plus the blanks (one per letter, hints filled in over time).
function FlagBlanks({ flag, pattern }) {
    return (
        <div style={{ textAlign: 'center' }}>
            {flag && (
                <img
                    src={flagUrl(flag, 320)}
                    alt="Flag to guess"
                    style={{ maxWidth: 320, border: '1px solid #ddd' }}
                />
            )}
            <p style={{ fontFamily: 'monospace', fontSize: 28, letterSpacing: 4 }}>
                {pattern.map((ch, i) => (
                    <span key={i}>{patternCell(ch)}</span>
                ))}
            </p>
        </div>
    );
}

export default FlagBlanks;
