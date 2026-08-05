const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Room = require('../models/Room');
const SavedFile = require('../models/SavedFile');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

const sanitizeUser = (user) => ({
  id: user._id,
  _id: user._id,
  username: user.username,
  email: user.email,
  fullName: user.fullName || '',
  bio: user.bio || '',
  location: user.location || '',
  website: user.website || '',
  avatarColor: user.avatarColor || '#6366f1',
  avatarUrl: user.avatarUrl || '',
  preferences: {
    theme: user.preferences?.theme || 'dark',
    editorTheme: user.preferences?.editorTheme || 'vs-dark',
    fontSize: user.preferences?.fontSize || 14,
    compactMode: Boolean(user.preferences?.compactMode),
    notifications: {
      roomUpdates: user.preferences?.notifications?.roomUpdates ?? true,
      mentions: user.preferences?.notifications?.mentions ?? true,
      fileChanges: user.preferences?.notifications?.fileChanges ?? true,
    },
    privacy: {
      showEmail: Boolean(user.preferences?.privacy?.showEmail),
      showOnlineStatus: user.preferences?.privacy?.showOnlineStatus ?? true,
      profileVisible: user.preferences?.privacy?.profileVisible ?? true,
    },
  },
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ message: 'All fields are required' });
    if (await User.findOne({ email }))
      return res.status(400).json({ message: 'Email already in use' });
    if (await User.findOne({ username }))
      return res.status(400).json({ message: 'Username already taken' });
    const user = await User.create({ username, email, password, fullName: username });
    res.status(201).json({ token: generateToken(user._id), user: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'All fields are required' });
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Invalid credentials' });
    res.json({ token: generateToken(user._id), user: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getMe = async (req, res) => {
  res.json(sanitizeUser(req.user));
};

const getUserProfile = async (req, res) => {
  try {
    const targetId = req.params.userId && req.params.userId !== 'me' ? req.params.userId : req.user._id;
    const targetUser = await User.findById(targetId).select('-password');
    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    const isSelf = targetUser._id.toString() === req.user._id.toString();
    const canViewEmail = isSelf || Boolean(targetUser.preferences?.privacy?.showEmail);

    const [roomsCreated, publicRooms, privateRooms, savedFilesCount, languagesUsed, recentRooms, recentFiles] = await Promise.all([
      Room.countDocuments({ creatorId: targetUser._id }),
      Room.countDocuments({ creatorId: targetUser._id, visibility: 'public' }),
      Room.countDocuments({ creatorId: targetUser._id, visibility: 'private' }),
      SavedFile.countDocuments({ userId: targetUser._id }),
      SavedFile.aggregate([
        { $match: { userId: targetUser._id } },
        { $group: { _id: '$language', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Room.find({ creatorId: targetUser._id }).sort({ updatedAt: -1 }).limit(5).select('name roomName visibility updatedAt createdAt'),
      SavedFile.find({ userId: targetUser._id }).sort({ updatedAt: -1 }).limit(5).select('filename language updatedAt createdAt roomId'),
    ]);

    const recentActivity = [
      ...recentRooms.map((room) => ({
        type: 'room',
        title: room.name || room.roomName || 'Room update',
        detail: room.visibility === 'private' ? 'Private room' : 'Public room',
        createdAt: room.updatedAt || room.createdAt,
      })),
      ...recentFiles.map((file) => ({
        type: 'file',
        title: file.filename || 'Saved file',
        detail: file.language || 'code',
        createdAt: file.updatedAt || file.createdAt,
      })),
    ].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 6);

    const payload = sanitizeUser(targetUser);
    res.json({
      user: {
        ...payload,
        email: canViewEmail ? payload.email : '',
      },
      stats: {
        totalRoomsCreated: roomsCreated,
        publicRooms,
        privateRooms,
        savedFiles: savedFilesCount,
        languagesUsed: (languagesUsed || []).map((item) => ({ language: item._id, count: item.count })),
      },
      recentActivity,
      isSelf,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateMe = async (req, res) => {
  try {
    const { username, email, fullName, bio, location, website, avatarColor, avatarUrl, preferences } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (username && username.trim() && username.trim() !== user.username) {
      const existingUsername = await User.findOne({ username: username.trim() });
      if (existingUsername && existingUsername._id.toString() !== user._id.toString()) {
        return res.status(400).json({ message: 'Username already taken' });
      }
      user.username = username.trim();
    }

    if (email && email.trim() && email.trim().toLowerCase() !== user.email) {
      const existingEmail = await User.findOne({ email: email.trim().toLowerCase() });
      if (existingEmail && existingEmail._id.toString() !== user._id.toString()) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      user.email = email.trim().toLowerCase();
    }

    if (typeof fullName === 'string') user.fullName = fullName.trim();
    if (typeof bio === 'string') user.bio = bio.trim();
    if (typeof location === 'string') user.location = location.trim();
    if (typeof website === 'string') user.website = website.trim();
    if (typeof avatarColor === 'string' && avatarColor.trim()) user.avatarColor = avatarColor.trim();
    if (typeof avatarUrl === 'string') user.avatarUrl = avatarUrl.trim();

    if (preferences) {
      user.preferences = {
        ...user.preferences,
        ...preferences,
        notifications: {
          ...(user.preferences?.notifications || {}),
          ...(preferences.notifications || {}),
        },
        privacy: {
          ...(user.preferences?.privacy || {}),
          ...(preferences.privacy || {}),
        },
      };
    }

    await user.save();
    res.json(sanitizeUser(user));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { register, login, getMe, getUserProfile, updateMe };
