const express = require('express');
const { register, login, getMe, getUserProfile, updateMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/profile/:userId', protect, getUserProfile);
router.put('/me', protect, updateMe);

module.exports = router;
