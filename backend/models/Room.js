const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  roomName: { type: String, trim: true },
  roomId: { type: String, required: true, unique: true },
  roomCode: { type: String, trim: true, unique: true, sparse: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  code: { type: String, default: '// Start coding here...' },
  htmlCode: { type: String, default: '' },
  cssCode: { type: String, default: '' },
  jsCode: { type: String, default: '' },
  language: { type: String, default: 'javascript', enum: ['javascript', 'python', 'java', 'cpp', 'c', 'csharp', 'go', 'php', 'ruby', 'rust', 'typescript', 'json', 'html', 'css'] },
  visibility: { type: String, enum: ['public', 'private'], default: 'public' },
  isPrivate: { type: Boolean, default: false },
  password: { type: String, default: '' },
  hashedPassword: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);
