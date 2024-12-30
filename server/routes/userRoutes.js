const express = require('express');
const router = express.Router();
const multer = require('multer');
const userController = require('../controllers/userController');
const uploadController = require('../controllers/uploadController');
const auth = require('../middleware/auth');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 2 * 1024 * 1024 // 2MB
    }
});

router.get('/profile', auth, userController.getProfile);
router.put('/profile', auth, userController.updateProfile);
router.post('/upload/avatar', auth, upload.single('file'), uploadController.uploadAvatar);

module.exports = router; 