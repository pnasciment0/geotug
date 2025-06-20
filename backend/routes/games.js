import express from 'express';

import {
} from '../controllers/games.js';

const router = express.Router();

const startGame = (req, res) => {
}
router.get('/', startGame);

export default router;