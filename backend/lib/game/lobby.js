// In-memory ready-up lobby state, keyed by gameId. This is ephemeral by design:
// it only matters between "room full" and "game start", so it lives in process
// memory rather than the database.

const readinessByGame = new Map(); // gameId -> { player1: bool, player2: bool }
const startingGames = new Set();   // gameIds currently transitioning into play

export function getReadiness(gameId) {
    let readiness = readinessByGame.get(gameId);
    if (!readiness) {
        readiness = { player1: false, player2: false };
        readinessByGame.set(gameId, readiness);
    }
    return readiness;
}

export function setReady(gameId, role, value) {
    const readiness = getReadiness(gameId);
    readiness[role] = value;
    return readiness;
}

export function bothReady(gameId) {
    const readiness = getReadiness(gameId);
    return readiness.player1 && readiness.player2;
}

export function resetReadiness(gameId) {
    readinessByGame.delete(gameId);
}

// "Starting" guard: set synchronously before the async game-start work so two
// simultaneous readies can't both kick off a game.
export const isStarting = (gameId) => startingGames.has(gameId);
export const markStarting = (gameId) => startingGames.add(gameId);
export const clearStarting = (gameId) => startingGames.delete(gameId);
