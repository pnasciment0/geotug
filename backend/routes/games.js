import express from 'express';

import {
    startGame,
    getGameById,
    joinGame
} from '../controllers/games.js';

const router = express.Router();

router.post('/', startGame);

router.get('/:id', getGameById);

router.put('/join/:id', joinGame);


export default router;