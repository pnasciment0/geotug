// UI phases the GamePage moves through, plus player-role helpers. Mirrors the
// backend roles/statuses but scoped to what the client needs to render.

export const PHASES = {
    LOADING: 'loading',
    WAITING: 'waiting',       // player, no opponent yet -> show invite link
    LOBBY: 'lobby',           // both present, ready-up
    COUNTDOWN: 'countdown',   // 3-2-1 before a flag is revealed
    PLAYING: 'playing',       // flag shown, guessing open
    INTERMISSION: 'intermission', // between rounds, showing the result
    OVER: 'over',             // game finished
    NOT_FOUND: 'not_found',   // link points to a game that was cancelled/never existed
};

export const ROLES = {
    PLAYER1: 'player1',
    PLAYER2: 'player2',
    SPECTATOR: 'spectator',
};

// How long a pause lasts before we assume the opponent is gone and offer the
// remaining player a way out.
export const PAUSE_GRACE_MS = 5000;

export const isPlayer = (role) => role === ROLES.PLAYER1 || role === ROLES.PLAYER2;

export const roleLabel = (role) => (role === ROLES.PLAYER1 ? 'Player 1' : 'Player 2');

// Human label for a round's winner, from the current player's perspective.
export const describeWinner = (winnerRole, myRole) => {
    if (!winnerRole) return 'No one';
    if (winnerRole === myRole) return 'You';
    return roleLabel(winnerRole);
};

// Phases in which the tug-of-war rope should be visible.
export const showsRope = (phase) =>
    phase === PHASES.COUNTDOWN ||
    phase === PHASES.PLAYING ||
    phase === PHASES.INTERMISSION ||
    phase === PHASES.OVER;
