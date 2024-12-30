const db = require('../config/database');

exports.getProfile = async (req, res) => {
    try {
        console.log('Getting profile for user:', req.user.id);
        const [users] = await db.query(
            'SELECT id, username, display_name as displayName, email, birthday, avatar_url as avatarUrl FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: '用户不存在' });
        }

        res.json(users[0]);
    } catch (error) {
        console.error('获取个人资料失败:', error);
        res.status(500).json({ message: '获取个人资料失败' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        console.log('Updating profile for user:', req.user.id);
        const { displayName, email, birthday } = req.body;

        // 检查邮箱是否已被使用
        const [existingUsers] = await db.query(
            'SELECT id FROM users WHERE email = ? AND id != ?',
            [email, req.user.id]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ message: '邮箱已被使用' });
        }

        // 更新用户资料
        await db.query(
            'UPDATE users SET display_name = ?, email = ?, birthday = ? WHERE id = ?',
            [displayName, email, birthday, req.user.id]
        );

        res.json({ message: '更新成功' });
    } catch (error) {
        console.error('更新个人资料失败:', error);
        res.status(500).json({ message: '更新个人资料失败' });
    }
}; 