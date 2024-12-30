const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');

// 管理员中间件
const isAdmin = async (req, res, next) => {
    if (!req.user.is_admin) {
        return res.status(403).json({ message: '需要管理员权限' });
    }
    next();
};

// 用户管理
router.get('/users', auth, isAdmin, adminController.getAllUsers);
router.put('/users/:userId/status', auth, isAdmin, adminController.updateUserStatus);

// 消息管理
router.delete('/messages/:messageId', auth, isAdmin, adminController.deleteMessage);

// 统计信息
router.get('/statistics', auth, isAdmin, adminController.getStatistics);

module.exports = router; 