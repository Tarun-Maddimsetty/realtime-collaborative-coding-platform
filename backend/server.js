require('dotenv').config();
const express   = require('express');
const http      = require('http');
const { Server } = require('socket.io');
const cors      = require('cors');
const connectDB = require('./config/db');
const authRoutes    = require('./routes/authRoutes');
const roomRoutes    = require('./routes/roomRoutes');
const fileRoutes    = require('./routes/fileRoutes');
const executeRoutes = require('./routes/executeRoutes');
const roomSocket    = require('./socket/roomSocket');

connectDB();

const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.CLIENT_URL]
  : /^http:\/\/localhost:(5173|5174|5175|5176|5177)$/;

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
};

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, { cors: corsOptions });

app.use(cors(corsOptions));
app.use(express.json());

app.use('/api/auth',    authRoutes);
app.use('/api/rooms',   roomRoutes);
app.use('/api/files',   fileRoutes);
app.use('/api/execute', executeRoutes);

app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

roomSocket(io);
app.set('io', io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
