import { API_BASE_URL } from './config';

// Low-level JSON fetch. Returns the parsed body (which may contain `{ error }`).
async function request(path, { method = 'GET', body } = {}) {
    const res = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
    });
    return res.json();
}

// --- Games API -----------------------------------------------------------
export const createGame = (playerId) =>
    request('/api/games', { method: 'POST', body: { playerId } });

export const fetchGame = (gameId) => request(`/api/games/${gameId}`);

export const joinGame = (gameId, playerId) =>
    request(`/api/games/join/${gameId}`, { method: 'PUT', body: { playerId } });

export const abandonGame = (gameId) =>
    request(`/api/games/abandon/${gameId}`, { method: 'PUT' });
