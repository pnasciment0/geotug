import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import countryRoutes from './routes/countries.js';
import gameRoutes from './routes/games.js';
import registerGameSocketHandlers from './lib/sockets/gameSockets.js';
import { EVENTS } from './lib/constants.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

io.on(EVENTS.CONNECTION, (socket) => {
  console.log(`⚡: ${socket.id} user just connected!`);

  registerGameSocketHandlers(socket, io);

  socket.on(EVENTS.DISCONNECT, () => {
    console.log('🔥: A user disconnected');
  });
})

app.use('/api/countries', countryRoutes);

app.use('/api/games', gameRoutes);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});