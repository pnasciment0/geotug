import { useState } from 'react';

// Shown to Player 1 while waiting for an opponent: the shareable invite link
// plus a copy-to-clipboard button.
function WaitingRoom({ gameId }) {
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
            <p>Waiting for an opponent. Share this link:</p>
            <div>
                <a href={gameLink}>{gameLink}</a>{' '}
                <button onClick={handleCopyLink}>{copied ? 'Copied!' : 'Copy link'}</button>
            </div>
        </div>
    );
}

export default WaitingRoom;
