const db = require('../config/database');
const bcrypt = require('bcryptjs');

// 获取所有用户列表
exports.getAllUsers = async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT id, username, is_admin, status, created_at FROM users'
        );
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '获取用户列表失败' });
    }
};

// 更新用户状态
exports.updateUserStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const { status } = req.body;

        await db.query(
            'UPDATE users SET status = ? WHERE id = ?',
            [status, userId]
        );

        res.json({ message: '用户状态更新成功' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '更新用户状态失败' });
    }
};

// 删除消息
exports.deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;

        await db.query(
            'UPDATE messages SET status = "deleted" WHERE id = ?',
            [messageId]
        );

        res.json({ message: '消息删除成功' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '删除消息失败' });
    }
};

// 获取系统统计信息
exports.getStatistics = async (req, res) => {
    try {
        const [[userCount]] = await db.query('SELECT COUNT(*) as count FROM users');
        const [[messageCount]] = await db.query('SELECT COUNT(*) as count FROM messages WHERE status = "active"');

        res.json({
            userCount: userCount.count,
            messageCount: messageCount.count
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '获取统计信息失败' });
    }
}; 