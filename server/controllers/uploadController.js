const path = require('path');
const fs = require('fs').promises;
const db = require('../config/database');

exports.uploadAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: '没有上传文件' });
        }

        // 创建用户专属的头像目录
        const userAvatarDir = path.join(__dirname, '../uploads/avatars', req.user.id.toString());
        await fs.mkdir(userAvatarDir, { recursive: true });

        // 生成文件名（使用时间戳确保唯一性）
        const ext = path.extname(req.file.originalname);
        const filename = `avatar_${Date.now()}${ext}`;
        const filepath = path.join(userAvatarDir, filename);

        // 保存文件
        await fs.writeFile(filepath, req.file.buffer);

        // 删除用户之前的头像（如果存在）
        const [oldAvatar] = await db.query('SELECT avatar_url FROM users WHERE id = ?', [req.user.id]);
        if (oldAvatar[0]?.avatar_url) {
            const oldPath = path.join(__dirname, '..', oldAvatar[0].avatar_url);
            try {
                await fs.unlink(oldPath);
            } catch (err) {
                console.error('删除旧头像失败:', err);
            }
        }

        // 更新用户头像URL（使用相对路径）
        const avatarUrl = `/uploads/avatars/${req.user.id}/${filename}`;
        await db.query(
            'UPDATE users SET avatar_url = ? WHERE id = ?',
            [avatarUrl, req.user.id]
        );

        res.json({
            url: avatarUrl
        });
    } catch (error) {
        console.error('上传头像失败:', error);
        res.status(500).json({ message: '上传失败' });
    }
}; 