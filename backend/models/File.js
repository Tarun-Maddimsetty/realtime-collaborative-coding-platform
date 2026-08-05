const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  language: { type: String, default: 'javascript' },
  code: { type: String, default: '' },
  roomId: { type: String, required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('File', fileSchema);
