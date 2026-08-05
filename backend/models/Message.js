const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  room:    { type: String, required: true },
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username:{ type: String, required: true },
  content: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
