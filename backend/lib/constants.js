// Shared backend constants: game lifecycle statuses, player roles, and the
// socket event names used between client and server. Centralizing these avoids
// stringly-typed typos scattered across the codebase.

export const GAME_STATUS = {
    WAITING: 'waiting',       // created, waiting for Player 2
    READY: 'ready',           // both players present, in the ready-up lobby
    IN_PROGRESS: 'in_progress',
    FINISHED: 'finished',
    ABANDONED: 'abandoned',   // a player left and the other chose to quit
};

export const ROLES = {
    PLAYER1: 'player1',
    PLAYER2: 'player2',
};

export const isPlayerRole = (role) => role === ROLES.PLAYER1 || role === ROLES.PLAYER2;

export const EVENTS = {
    // Built-in socket.io events
    CONNECTION: 'connection',
    DISCONNECT: 'disconnect',

    // Client -> server
    JOIN_GAME_ROOM: 'joinGameRoom',
    PLAYER_READY: 'playerReady',
    PLAYER_UNREADY: 'playerUnready',
    SUBMIT_GUESS: 'submitGuess',

    // Server -> client
    PLAYERS_UPDATED: 'playersUpdated',
    READINESS_UPDATED: 'readinessUpdated',
    ROUND_STARTING: 'roundStarting',
    ROUND_SNAPSHOT: 'roundSnapshot',
    HINT_REVEALED: 'hintRevealed',
    GUESS_RESULT: 'guessResult',
    ROUND_RESULT: 'roundResult',
    OPPONENT_LEFT: 'opponentLeft',
    GAME_PAUSED: 'gamePaused',
    GAME_RESUMED: 'gameResumed',
    ERROR: 'error',
};
