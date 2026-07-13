import { useState } from 'react';

// Shown to Player 1 while waiting for an opponent: the shareable invite link
// plus a copy-to-clipboard button.
function WaitingRoom({ gameId, onCancel }) {
    const [copied, setCopied] = useState(false);
    const gameLink = `${window.location.origin}/game/${gameId}`;

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(gameLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.log('Failed to copy link:', error);
        }
    };

    return (
        <div>
            <p>Waiting for an opponent. Send this link to a friend to start:</p>
            <div>
                <a href={gameLink}>{gameLink}</a>{' '}
                <button onClick={handleCopyLink}>{copied ? 'Copied!' : 'Copy link'}</button>
            </div>
            <p style={{ color: '#666', fontSize: '0.9em' }}>
                They can open it directly, or paste it into “Join Game.”
            </p>
            {onCancel && (
                <button onClick={onCancel} style={{ marginTop: '1rem' }}>
                    Back
                </button>
            )}
        </div>
    );
}

export default WaitingRoom;
