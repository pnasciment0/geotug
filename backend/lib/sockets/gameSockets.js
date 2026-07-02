import prisma from '../prisma.js';
import { EVENTS, isPlayerRole } from '../constants.js';
import {
    getReadiness,
    setReady,
    bothReady,
    resetReadiness,
    isStarting,
    markStarting,
    clearStarting,
} from '../game/lobby.js';
import {
    hasRound,
    beginRound,
    submitGuess,
    getReconnectSnapshot,
    playerConnected,
    playerDisconnected,
} from '../game/rounds.js';

// Thin socket wiring: this file only translates socket events into calls on the
// lobby/round modules. All game logic lives in ../game/*.
export default function registerGameSocketHandlers(socket, io) {
    const gameStarted = (gameId) => hasRound(gameId) || isStarting(gameId);

    socket.on(EVENTS.JOIN_GAME_ROOM, async ({ gameId, playerId, role }) => {
        try {
            const game = await prisma.game.findUnique({ where: { id: gameId } });
            if (!game) {
                socket.emit(EVENTS.ERROR, { message: 'Game not found' });
                return;
            }

            socket.data.gameId = gameId;
            socket.data.playerId = playerId;
            socket.data.role = role;

            socket.join(gameId);
            console.log(`🕹️ ${role} (${playerId}) joined room ${gameId}`);

            io.to(gameId).emit(EVENTS.PLAYERS_UPDATED, game);
            socket.emit(EVENTS.READINESS_UPDATED, getReadiness(gameId));

            // Catch a (re)connecting client up to a round already in progress.
            const snapshot = getReconnectSnapshot(gameId);
            if (snapshot) {
                socket.emit(EVENTS.ROUND_SNAPSHOT, { ...snapshot, tugIndex: game.tugIndex });
            }

            // Track presence; if a paused game now has both players back, it resumes.
            if (isPlayerRole(role)) {
                playerConnected(gameId, io, playerId);
            }
        } catch (error) {
            console.error('Error joining game room:', error);
            socket.emit(EVENTS.ERROR, { message: 'Failed to join game room' });
        }
    });

    socket.on(EVENTS.PLAYER_READY, async ({ gameId, role }) => {
        try {
            if (!isPlayerRole(role) || gameStarted(gameId)) return;

            const game = await prisma.game.findUnique({ where: { id: gameId } });
            if (!game || !game.player1Id || !game.player2Id) return; // both seats required

            const readiness = setReady(gameId, role, true);
            io.to(gameId).emit(EVENTS.READINESS_UPDATED, readiness);

            if (bothReady(gameId) && !isStarting(gameId)) {
                markStarting(gameId); // atomic guard against a double-start
                resetReadiness(gameId);
                try {
                    await beginRound(gameId, io, { first: true });
                } finally {
                    clearStarting(gameId);
                }
            }
        } catch (error) {
            console.error('Error handling playerReady:', error);
        }
    });

    socket.on(EVENTS.PLAYER_UNREADY, ({ gameId, role }) => {
        if (!isPlayerRole(role) || gameStarted(gameId)) return;
        const readiness = setReady(gameId, role, false);
        io.to(gameId).emit(EVENTS.READINESS_UPDATED, readiness);
    });

    socket.on(EVENTS.SUBMIT_GUESS, async ({ gameId, playerId, role, guess }) => {
        try {
            if (!isPlayerRole(role)) return;
            await submitGuess(gameId, io, { playerId, role, guess });
        } catch (error) {
            console.error('Error handling submitGuess:', error);
        }
    });

    socket.on(EVENTS.DISCONNECT, () => {
        const { gameId, playerId, role } = socket.data || {};
        if (!gameId) return;

        if (gameStarted(gameId)) {
            // Mid-game: pause and wait for the player to reconnect.
            if (isPlayerRole(role)) {
                playerDisconnected(gameId, io, playerId);
            }
        } else {
            // Pre-game: reset the lobby so the remaining player waits rather
            // than starting alone.
            resetReadiness(gameId);
            io.to(gameId).emit(EVENTS.READINESS_UPDATED, { player1: false, player2: false });
            io.to(gameId).emit(EVENTS.OPPONENT_LEFT, { role });
        }
    });
}
