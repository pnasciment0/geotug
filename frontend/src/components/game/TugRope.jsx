// The tug-of-war bar. The knot slides (animated) to the rope position, where
// -3 = Player 2 wins (far left) and +3 = Player 1 wins (far right).
function TugRope({ tugIndex }) {
    const knotPercent = ((tugIndex + 3) / 6) * 100;

    return (
        <div style={{ margin: '24px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#888' }}>
                <span>◀ Player 2</span>
                <span>Player 1 ▶</span>
            </div>
            <div style={{ position: 'relative', height: 24, background: '#eee', borderRadius: 12 }}>
                <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 2, background: '#bbb' }} />
                <div
                    style={{
                        position: 'absolute',
                        top: -4,
                        left: `${knotPercent}%`,
                        transform: 'translateX(-50%)',
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: '#e8491d',
                        transition: 'left 0.8s cubic-bezier(0.22, 1, 0.36, 1)',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                    }}
                />
            </div>
            <p style={{ textAlign: 'center', fontSize: 12, color: '#888' }}>
                Rope: {tugIndex.toFixed(2)} (win at ±3)
            </p>
        </div>
    );
}

export default TugRope;
