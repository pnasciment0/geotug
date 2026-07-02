// A player's identity is generated on their device and kept in localStorage,
// keyed per game, so the shared invite link can stay clean (no id in the URL).

const keyFor = (gameId) => `geotug_player_${gameId}`;

export const createPlayerId = () => crypto.randomUUID();

export const getStoredPlayerId = (gameId) => localStorage.getItem(keyFor(gameId));

export const storePlayerId = (gameId, playerId) => localStorage.setItem(keyFor(gameId), playerId);
