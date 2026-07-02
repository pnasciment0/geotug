import express from 'express';

import {
    startGame,
    getGameById,
    joinGame,
    abandonGame
} from '../controllers/games.js';

const router = express.Router();

router.post('/', startGame);

router.get('/:id', getGameById);

router.put('/join/:id', joinGame);

router.put('/abandon/:id', abandonGame);


export default router;