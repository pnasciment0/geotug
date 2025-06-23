import express from 'express';

import {
    startGame
} from '../controllers/games.js';

const router = express.Router();

router.post('/', startGame);

export default router;