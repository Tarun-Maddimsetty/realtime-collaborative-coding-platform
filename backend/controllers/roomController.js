const { nanoid } = require('nanoid');
const bcrypt = require('bcryptjs');
const Room = require('../models/Room');
const Message = require('../models/Message');
const File = require('../models/File');
const SavedFile = require('../models/SavedFile');

const serializeSavedFile = (file, currentUser) => ({
  _id: file._id,
  id: file._id,
  name: file.filename || file.name,
  filename: file.filename || file.name,
  language: file.language,
  code: file.code || '',
  roomId: file.roomId,
  userId: file.userId || file.user,
  user: currentUser ? { _id: currentUser._id, username: currentUser.username } : undefined,
  createdAt: file.createdAt,
  updatedAt: file.updatedAt,
});

const createRoom = async (req, res) => {
  try {
    const { name, roomName, language, isPrivate, visibility, roomCode, password } = req.body;
    const safeName = (roomName || name || '').trim();
    const normalizedLanguage = (language || 'javascript').toLowerCase();
    const supportedLanguages = ['javascript', 'python', 'java', 'cpp', 'c', 'csharp', 'go', 'php', 'ruby', 'rust', 'typescript', 'json', 'html', 'css'];

    if (!safeName) return res.status(400).json({ message: 'Room name is required' });

    const normalizedVisibility = visibility === 'private' || isPrivate ? 'private' : 'public';
    let finalRoomCode = (roomCode || '').trim().toUpperCase();

    if (normalizedVisibility === 'private') {
      if (!finalRoomCode) return res.status(400).json({ message: 'Private rooms require a room code' });
      if (!password || !password.trim()) return res.status(400).json({ message: 'Private rooms require a password' });
    } else if (!finalRoomCode) {
      finalRoomCode = nanoid(8).toUpperCase();
    }

    if (!supportedLanguages.includes(normalizedLanguage)) {
      return res.status(400).json({ message: 'Unsupported language' });
    }

    const existingRoom = await Room.findOne({ roomCode: finalRoomCode });
    if (existingRoom) return res.status(409).json({ message: 'Room code already exists. Please choose another one.' });

    const hashedPassword = normalizedVisibility === 'private'
      ? await bcrypt.hash(password.trim(), 10)
      : '';

    const defaultCodeByLanguage = {
      html: '<!DOCTYPE html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <title>Preview</title>\n  </head>\n  <body>\n    <h1>Hello from HTML</h1>\n  </body>\n</html>',
      css: 'body {\n  font-family: system-ui, sans-serif;\n  margin: 0;\n  padding: 24px;\n  background: #111827;\n  color: #f9fafb;\n}',
      javascript: '// Start coding here...\nconsole.log("Hello from JavaScript");',
    };

    const defaultCode = defaultCodeByLanguage[normalizedLanguage] || '// Start coding here...';

    const room = await Room.create({
      name: safeName,
      roomName: safeName,
      roomId: nanoid(10),
      roomCode: finalRoomCode,
      owner: req.user._id,
      creatorId: req.user._id,
      participants: [req.user._id],
      code: defaultCode,
      htmlCode: normalizedLanguage === 'html' ? defaultCode : '',
      cssCode: normalizedLanguage === 'css' ? defaultCode : '',
      jsCode: normalizedLanguage === 'javascript' ? defaultCode : '',
      language: normalizedLanguage || 'javascript',
      isPrivate: normalizedVisibility === 'private',
      visibility: normalizedVisibility,
      password: hashedPassword,
      hashedPassword,
    });

    if (normalizedLanguage === 'html') {
      await File.create({
        name: 'index.html',
        language: 'html',
        code: defaultCode,
        roomId: room.roomId,
        user: req.user._id,
      });
      await SavedFile.create({
        filename: 'index.html',
        language: 'html',
        code: defaultCode,
        roomId: room.roomId,
        userId: req.user._id,
      });
    }

    if (normalizedLanguage === 'css') {
      await File.create({
        name: 'style.css',
        language: 'css',
        code: defaultCode,
        roomId: room.roomId,
        user: req.user._id,
      });
      await SavedFile.create({
        filename: 'style.css',
        language: 'css',
        code: defaultCode,
        roomId: room.roomId,
        userId: req.user._id,
      });
    }

    await room.populate('owner', 'username email');
    res.status(201).json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getRooms = async (req, res) => {
  try {
    const search = req.query.search?.trim();
    const visibility = req.query.visibility || 'public';
    const includeAll = req.query.all === 'true' || visibility === 'all';

    const query = includeAll ? {} : { visibility: visibility === 'private' ? 'private' : 'public' };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { roomName: { $regex: search, $options: 'i' } },
        { roomCode: { $regex: search, $options: 'i' } },
      ];
    }

    const rooms = await Room.find(query)
      .populate('owner', 'username fullName avatarColor avatarUrl')
      .populate('participants', 'username fullName avatarColor avatarUrl')
      .sort({ updatedAt: -1 });

    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getRoomById = async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId })
      .populate('owner', 'username email fullName bio avatarColor avatarUrl preferences createdAt')
      .populate('participants', 'username email fullName bio avatarColor avatarUrl preferences createdAt');

    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (room.visibility === 'private' && !room.participants.some((participant) => participant._id.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'This room is private' });
    }

    res.json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const joinRoom = async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });
    if (!room) return res.status(404).json({ message: 'Room not found' });

    if (room.visibility === 'private') {
      return res.status(403).json({ message: 'Use the room code flow for private rooms' });
    }

    if (!room.participants.some((participant) => participant.toString() === req.user._id.toString())) {
      room.participants.push(req.user._id);
      await room.save();
    }

    await room.populate('owner', 'username email');
    await room.populate('participants', 'username email');
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const joinRoomByCode = async (req, res) => {
  try {
    const { roomCode, password } = req.body;
    if (!roomCode?.trim()) return res.status(400).json({ message: 'Room code is required' });

    const room = await Room.findOne({ roomCode: roomCode.trim().toUpperCase() });
    if (!room) return res.status(404).json({ message: 'Room not found' });

    if (room.visibility === 'private') {
      if (!password) {
        return res.status(403).json({
          message: 'Private room password required',
          requiresPassword: true,
          room: {
            roomId: room.roomId,
            roomName: room.roomName || room.name,
            roomCode: room.roomCode,
            visibility: room.visibility,
          },
        });
      }

      const isMatch = await bcrypt.compare(password, room.hashedPassword || room.password || '');
      if (!isMatch) return res.status(401).json({ message: 'Incorrect room password.' });
    }

    if (!room.participants.some((participant) => participant.toString() === req.user._id.toString())) {
      room.participants.push(req.user._id);
      await room.save();
    }

    await room.populate('owner', 'username email');
    await room.populate('participants', 'username email');
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const leaveRoom = async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });
    if (!room) return res.status(404).json({ message: 'Room not found' });
    room.participants = room.participants.filter((participant) => participant.toString() !== req.user._id.toString());
    await room.save();
    res.json({ message: 'Left room successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (room.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the room owner can delete this room' });
    }

    await Message.deleteMany({ room: req.params.roomId });
    await room.deleteOne();

    if (req.app.get('io')) {
      const io = req.app.get('io');
      const roomSockets = io.sockets.adapter.rooms.get(req.params.roomId);
      if (roomSockets) {
        roomSockets.forEach((socketId) => {
          const socket = io.sockets.sockets.get(socketId);
          if (socket) {
            socket.leave(req.params.roomId);
            socket.emit('room-deleted', { message: 'Room has been deleted' });
          }
        });
      }
      io.to(req.params.roomId).emit('room-deleted', { message: 'Room has been deleted' });
    }

    res.json({ message: 'Room deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const saveCode = async (req, res) => {
  try {
    const { code, language } = req.body;
    const room = await Room.findOneAndUpdate(
      { roomId: req.params.roomId },
      { code, language },
      { new: true }
    );
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.json({ message: 'Code saved', code: room.code, language: room.language });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getParticipants = async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId }).populate('participants', 'username email fullName bio avatarColor avatarUrl preferences createdAt');
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.json(room.participants);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const listUserFiles = async (req, res) => {
  try {
    const files = await SavedFile.find({ userId: req.user._id }).sort({ updatedAt: -1 });
    res.json(files.map((file) => serializeSavedFile(file, req.user)));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const listSavedFiles = async (req, res) => {
  try {
    const files = await SavedFile.find({ userId: req.user._id }).sort({ updatedAt: -1 });
    res.json(files.map((file) => serializeSavedFile(file, req.user)));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getSavedFileById = async (req, res) => {
  try {
    const file = await SavedFile.findById(req.params.fileId);
    if (!file) return res.status(404).json({ message: 'File not found' });
    if (file.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the file owner can access this file' });
    }
    res.json(serializeSavedFile(file, req.user));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const listFiles = async (req, res) => {
  try {
    const files = await SavedFile.find({ roomId: req.params.roomId }).sort({ updatedAt: -1 });
    res.json(files.map((file) => serializeSavedFile(file, req.user)));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createFile = async (req, res) => {
  try {
    const { name, filename, language, code } = req.body;
    const finalName = (filename || name || '').trim();
    if (!finalName) return res.status(400).json({ message: 'File name is required' });

    const room = await Room.findOne({ roomId: req.params.roomId });
    if (!room) return res.status(404).json({ message: 'Room not found' });

    const savedFile = await SavedFile.create({
      filename: finalName,
      language: language || 'javascript',
      code: code || '',
      roomId: req.params.roomId,
      userId: req.user._id,
    });

    res.status(201).json(serializeSavedFile(savedFile, req.user));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const saveFile = async (req, res) => {
  try {
    const { name, filename, language, code, roomId } = req.body;
    const finalName = (filename || name || '').trim();
    if (!finalName) return res.status(400).json({ message: 'File name is required' });

    const savedFile = await SavedFile.create({
      filename: finalName,
      language: language || 'javascript',
      code: code || '',
      roomId: roomId || '',
      userId: req.user._id,
    });

    res.status(201).json(serializeSavedFile(savedFile, req.user));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateFile = async (req, res) => {
  try {
    const file = await SavedFile.findById(req.params.fileId);
    if (!file) return res.status(404).json({ message: 'File not found' });
    if (file.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the file owner can edit this file' });
    }

    const incomingName = req.body.filename || req.body.name;
    file.filename = incomingName?.trim() || file.filename;
    file.language = req.body.language || file.language;
    file.code = req.body.code ?? file.code;
    await file.save();

    res.json(serializeSavedFile(file, req.user));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteFile = async (req, res) => {
  try {
    const file = await SavedFile.findById(req.params.fileId);
    if (!file) return res.status(404).json({ message: 'File not found' });
    if (file.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the file owner can delete this file' });
    }

    await file.deleteOne();
    res.json({ message: 'File deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createRoom,
  getRooms,
  getRoomById,
  joinRoom,
  joinRoomByCode,
  leaveRoom,
  deleteRoom,
  saveCode,
  getParticipants,
  listUserFiles,
  listSavedFiles,
  getSavedFileById,
  listFiles,
  createFile,
  saveFile,
  updateFile,
  deleteFile,
};
