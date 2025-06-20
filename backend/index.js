import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import countryRoutes from './routes/countries.js';
import gameRoutes from './routes/games.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/countries', countryRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});