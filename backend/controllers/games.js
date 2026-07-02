 import prisma from '../lib/prisma.js';
 import crypto from 'crypto';
 import { GAME_STATUS } from '../lib/constants.js';

 export const startGame = async (req, res) => {
    try {
        const newGame = await prisma.game.create({
            data: {
                id: crypto.randomUUID(),
                player1Id: req.body.playerId,
                status: GAME_STATUS.WAITING,
                type: 'private'
            }
        })
        res.json({ gameId: newGame.id });
    } catch (error) {
        console.log('Error starting game:', error);
        res.status(500).json({ error: 'Server Error: ${error}' });
    }
 }

 export const getGameById = async (req, res) => {
    try {
        const game = await prisma.game.findUnique({
            where: { id: req.params.id },
        });

        if (!game) return res.status(404).json({ error: 'Game not found' });
        res.json(game);
    } catch (error) {
        console.log('Error fetching game:', error);
        res.status(500).json({ error: `Server Error: ${error}` });
    }
 };

 export const joinGame = async (req, res) => {
    try {
        const game = await prisma.game.findUnique({
            where: { id: req.params.id },
        });

        if (!game) return res.status(404).json({ error: 'Game not found' });

        if (game.status !== GAME_STATUS.WAITING) return res.status(400).json({ error: 'Game is not available for joining' });

        if (game.player2Id) return res.status(400).json({ error: 'Game already has two players' });

        // Player 2 has joined, but the game doesn't begin until both players
        // ready up. The first flag is chosen at start time (see game/rounds.js).
        const updatedGame = await prisma.game.update({
            where: { id: game.id },
            data: {
                player2Id: req.body.playerId,
                status: GAME_STATUS.READY
            }
        });

        res.json(updatedGame)

    } catch (error) {
        console.log('Error joining game:', error);
        res.status(500).json({ error: `Server Error: ${error}` });
    }
 }

 export const abandonGame = async (req, res) => {
    try {
        const game = await prisma.game.findUnique({
            where: { id: req.params.id },
        });

        if (!game) return res.status(404).json({ error: 'Game not found' });

        const updatedGame = await prisma.game.update({
            where: { id: game.id },
            data: { status: GAME_STATUS.ABANDONED },
        });

        res.json(updatedGame);
    } catch (error) {
        console.log('Error abandoning game:', error);
        res.status(500).json({ error: `Server Error: ${error}` });
    }
 }