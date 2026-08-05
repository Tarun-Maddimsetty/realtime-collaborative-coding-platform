const express = require('express');
const {
  createRoom,
  getRooms,
  getRoomById,
  joinRoom,
  joinRoomByCode,
  leaveRoom,
  deleteRoom,
  saveCode,
  getParticipants,
  listUserFiles,
  listFiles,
  createFile,
  updateFile,
  deleteFile,
} = require('../controllers/roomController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.get('/', getRooms);
router.post('/', createRoom);
router.post('/join-by-code', joinRoomByCode);
router.get('/files/me', listUserFiles);
router.get('/:roomId', getRoomById);
router.post('/:roomId/join', joinRoom);
router.post('/:roomId/leave', leaveRoom);
router.delete('/:roomId', deleteRoom);
router.put('/:roomId/code', saveCode);
router.get('/:roomId/participants', getParticipants);
router.get('/:roomId/files', listFiles);
router.post('/:roomId/files', createFile);
router.put('/:roomId/files/:fileId', updateFile);
router.delete('/:roomId/files/:fileId', deleteFile);

module.exports = router;
