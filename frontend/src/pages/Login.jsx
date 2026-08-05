// server/routes/auth.js
import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = express.Router();

/* ---------- Model ---------- */
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
  },
  { timestamps: true }
);

// Hash ONLY here, and only when changed — prevents the double-hash that breaks login
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
const norm = (v) => String(v || '').toLowerCase().trim();

/* ---------- Register ---------- */
router.post('/register', async (req, res) => {
  try {
    const email = norm(req.body.email);
    const { name, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'All fields are required' });

    if (await User.findOne({ email }))
      return res.status(409).json({ message: 'Email already registered' });

    // pass the PLAIN password — the pre-save hook hashes it
    const user = await User.create({ name, email, password });

    res.status(201).json({
      token: sign(user._id),
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error('register error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ---------- Login ---------- */
router.post('/login', async (req, res) => {
  try {
    const email = norm(req.body.email);
    const { password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    // .select('+password') is required because the field is select:false
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: 'Invalid email or password' });

    res.json({
      token: sign(user._id),
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

