 import prisma from '../lib/prisma.js';

 export const startGame = async (req, res) => {
    try {
        const newGame = await prisma.game.create({
            data: {
                id: crypto.randomUUID(),
                player1Id: req.body.playerId,
                status: 'waiting',
                type: 'private'
            }
        })
        res.json({ gameId: newGame.id });
    } catch (error) {
        console.log('Error starting game:', error);
        res.status(500).json({ error: 'Server Error: ${error}' });
    }
 }
 