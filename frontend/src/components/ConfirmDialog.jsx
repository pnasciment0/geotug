// A small modal confirmation dialog. Renders a dimmed backdrop with a centered
// card; calls onConfirm / onCancel for the two actions.
function ConfirmDialog({ message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, onCancel }) {
    return (
        <div
            onClick={onCancel}
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: '#fff',
                    color: '#222',
                    padding: 24,
                    borderRadius: 8,
                    maxWidth: 360,
                    textAlign: 'center',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                }}
            >
                <p style={{ marginTop: 0 }}>{message}</p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                    <button onClick={onConfirm} style={{ background: '#e8491d', color: '#fff' }}>
                        {confirmLabel}
                    </button>
                    <button onClick={onCancel}>{cancelLabel}</button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmDialog;
