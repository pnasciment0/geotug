import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import countryRoutes from './routes/countries.js';
import gameRoutes from './routes/games.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server);

io.on('connection', (socket) => {
  console.log('A user has connected');
})

app.use('/api/countries', countryRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});