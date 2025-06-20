import express from 'express';

import {
    getRandomCountry
} from '../controllers/countries.js';

const router = express.Router();

router.get('/', getRandomCountry);

export default router;