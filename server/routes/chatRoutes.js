const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const auth = require('../middleware/auth');

router.get('/rooms', auth, chatController.getRooms);
router.post('/rooms', auth, chatController.createRoom);
router.get('/rooms/:roomId/messages', auth, chatController.getMessages);

module.exports = router; 