import { io } from 'socket.io-client';
import { SOCKET_URL } from './config';

export const socket = io(SOCKET_URL, { autoConnect: false });

// Server -> client event names, mapped to the handler key callers pass in.
const SERVER_EVENTS = {
    onPlayersUpdated: 'playersUpdated',
    onReadinessUpdated: 'readinessUpdated',
    onRoundStarting: 'roundStarting',
    onRoundSnapshot: 'roundSnapshot',
    onHintRevealed: 'hintRevealed',
    onGuessResult: 'guessResult',
    onRoundResult: 'roundResult',
    onOpponentLeft: 'opponentLeft',
    onGamePaused: 'gamePaused',
    onGameResumed: 'gameResumed',
};

export const connectSocket = () => socket.connect();
export const disconnectSocket = () => socket.disconnect();

// --- Emit helpers (client -> server) -------------------------------------
export const joinGameRoom = ({ gameId, playerId, role }) =>
    socket.emit('joinGameRoom', { gameId, playerId, role });

export const emitPlayerReady = ({ gameId, role }) =>
    socket.emit('playerReady', { gameId, role });

export const emitPlayerUnready = ({ gameId, role }) =>
    socket.emit('playerUnready', { gameId, role });

export const emitSubmitGuess = ({ gameId, playerId, role, guess }) =>
    socket.emit('submitGuess', { gameId, playerId, role, guess });

// Register all game listeners at once. `handlers` is an object of optional
// callbacks keyed like `onRoundResult`. Returns an unsubscribe function that
// removes exactly the listeners it added.
export function subscribeToGameEvents(handlers) {
    const registered = Object.entries(SERVER_EVENTS)
        .filter(([key]) => typeof handlers[key] === 'function')
        .map(([key, event]) => {
            const cb = handlers[key];
            socket.on(event, cb);
            return [event, cb];
        });

    return () => registered.forEach(([event, cb]) => socket.off(event, cb));
}
