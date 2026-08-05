const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const defaultPreferences = {
  theme: 'dark',
  editorTheme: 'vs-dark',
  fontSize: 14,
  compactMode: false,
  notifications: {
    roomUpdates: true,
    mentions: true,
    fileChanges: true,
  },
  privacy: {
    showEmail: false,
    showOnlineStatus: true,
    profileVisible: true,
  },
};

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, minlength: 3 },
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  fullName: { type: String, default: '' },
  bio: { type: String, default: '' },
  location: { type: String, default: '' },
  website: { type: String, default: '' },
  avatarColor: { type: String, default: '#6366f1' },
  avatarUrl: { type: String, default: '' },
  preferences: {
    type: Object,
    default: defaultPreferences,
  },
}, { timestamps: true });

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.matchPassword = function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
