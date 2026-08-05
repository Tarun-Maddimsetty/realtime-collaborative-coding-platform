const express = require('express');
const {
  listSavedFiles,
  getSavedFileById,
  saveFile,
  updateFile,
  deleteFile,
} = require('../controllers/roomController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.get('/', listSavedFiles);
router.get('/:fileId', getSavedFileById);
router.post('/save', saveFile);
router.put('/:fileId', updateFile);
router.delete('/:fileId', deleteFile);

module.exports = router;
