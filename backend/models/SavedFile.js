const mongoose = require('mongoose');

const savedFileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  roomId: { type: String, default: '', index: true },
  filename: { type: String, required: true, trim: true },
  language: { type: String, default: 'javascript' },
  code: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('SavedFile', savedFileSchema);
