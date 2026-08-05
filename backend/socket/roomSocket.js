const Room    = require('../models/Room');
const Message = require('../models/Message');
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');

// roomId -> Map<socketId, { userId, username }>
const activeUsers = {};

const emitRoomActivity = (io, roomId) => {
  const roomParticipants = Array.from(activeUsers[roomId]?.values?.() || []).map(({ userId, username }) => ({
    _id: userId,
    username,
  }));

  io.to(roomId).emit('room-activity', {
    roomId,
    participants: roomParticipants,
    active: roomParticipants.length > 0,
    updatedAt: new Date().toISOString(),
  });
};

const roomSocket = (io) => {

  // ── Socket.IO auth middleware ──────────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('No token provided'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user    = await User.findById(decoded.id).select('-password');

      if (!user) return next(new Error('User not found'));

      socket.user = user;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  // ── Connection handler ─────────────────────────────────────────────────────
  io.on('connection', (socket) => {

    // Join room
    socket.on('join-room', async (roomId) => {
      socket.join(roomId);

      if (!activeUsers[roomId]) activeUsers[roomId] = new Map();
      activeUsers[roomId].set(socket.id, {
        userId:   socket.user._id,
        username: socket.user.username,
      });

      // Restore saved code for the joining user
      const room = await Room.findOne({ roomId });
      if (room) socket.emit('load-code', { code: room.code, language: room.language });

      // Send last 50 chat messages
      const messages = await Message.find({ room: roomId })
        .sort({ createdAt: 1 })
        .limit(50);
      socket.emit('chat-history', messages);

      // Notify others and broadcast updated user list
      socket.to(roomId).emit('user-joined', { username: socket.user.username });
      io.to(roomId).emit('active-users', Array.from(activeUsers[roomId].values()));
      emitRoomActivity(io, roomId);
    });

    // Code sync — broadcast delta and persist to DB
    socket.on('code-change', async ({ roomId, code, language, htmlCode = '', cssCode = '', jsCode = '' }) => {
      const payload = { code, language, htmlCode, cssCode, jsCode };
      socket.to(roomId).emit('code-update', payload);
      await Room.findOneAndUpdate({ roomId }, { code, language, htmlCode, cssCode, jsCode });
    });

    // Language change — whitelist to prevent arbitrary values reaching the DB
    socket.on('language-change', ({ roomId, language }) => {
      const ALLOWED = ['javascript', 'python', 'java', 'cpp', 'c', 'csharp', 'go', 'php', 'ruby', 'rust', 'typescript', 'json', 'html', 'css'];
      if (!ALLOWED.includes(language)) return;
      socket.to(roomId).emit('language-update', { language });
    });

    // Chat message
    socket.on('send-message', async ({ roomId, content }) => {
      if (!content?.trim()) return;
      const message = await Message.create({
        room:     roomId,
        user:     socket.user._id,
        username: socket.user.username,
        content:  content.trim(),
      });
      io.to(roomId).emit('new-message', message);
    });

    // Explicit leave
    socket.on('leave-room', (roomId) => handleLeave(socket, io, roomId));

    // Disconnect — socket.rooms includes the socket's own ID room, so
    // filter to only rooms that exist in activeUsers to avoid spurious calls
    socket.on('disconnect', () => {
      for (const roomId of socket.rooms) {
        if (activeUsers[roomId]) handleLeave(socket, io, roomId);
      }
    });
  });
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const handleLeave = async (socket, io, roomId) => {
  if (!activeUsers[roomId]) return;

  activeUsers[roomId].delete(socket.id);

  if (activeUsers[roomId].size === 0) {
    delete activeUsers[roomId];
    // Auto-delete the room and its messages when the last participant leaves
    try {
      await Room.findOneAndDelete({ roomId });
      await Message.deleteMany({ room: roomId });
    } catch (err) {
      console.error('[roomSocket] auto-delete failed:', err.message);
    }
  } else {
    io.to(roomId).emit('active-users', Array.from(activeUsers[roomId].values()));
  }

  emitRoomActivity(io, roomId);
  socket.to(roomId).emit('user-left', { username: socket.user?.username });
};

module.exports = roomSocket;
