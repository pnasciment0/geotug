import prisma from '../prisma.js';

export default function registerGameSocketHandlers(socket, io) {
    socket.on('joinGameRoom', async ({ gameId, playerId, role }) => {
        try {
            const game = await prisma.game.findUnique({
                where: { id: gameId },
            });

            if (!game) {
                socket.emit('error', { message: 'Game not found' });
                return;
            }

            socket.join(gameId);
            console.log(`🕹️ ${role} (${playerId}) joined room ${gameId}`);

            // Broadcast the current player state to everyone in the room so
            // both players stay in sync (e.g. Player 1 sees Player 2 join).
            io.to(gameId).emit('playersUpdated', game);
        } catch (error) {
            console.error('Error joining game room:', error);
            socket.emit('error', { message: 'Failed to join game room' });
        }
    });
}
