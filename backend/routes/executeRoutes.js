const express = require('express');
const { executeCode } = require('../controllers/executeController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, executeCode);

module.exports = router;
