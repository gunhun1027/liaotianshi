const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const JWT_SECRET = 'your-secret-key';

exports.register = async (req, res) => {
    try {
        const { username, password, displayName, email } = req.body;
        
        // 检查用户是否已存在
        const [existingUsers] = await db.query(
            'SELECT * FROM users WHERE username = ? OR email = ?', 
            [username, email]
        );
        
        if (existingUsers.length > 0) {
            const field = existingUsers[0].username === username ? '用户名' : '邮箱';
            return res.status(400).json({ message: `${field}已存在` });
        }

        // 加密密码
        const hashedPassword = await bcrypt.hash(password, 10);

        // 创建新用户
        const [result] = await db.query(
            'INSERT INTO users (username, password, display_name, email, is_admin) VALUES (?, ?, ?, ?, false)',
            [username, hashedPassword, displayName, email]
        );

        res.status(201).json({ message: '注册成功', userId: result.insertId });
    } catch (error) {
        console.error('注册失败:', error);
        res.status(500).json({ message: '服务器错误' });
    }
};

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // 查找用户
        const [users] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        if (users.length === 0) {
            return res.status(401).json({ message: '用户名或密码错误' });
        }

        const user = users[0];

        // 检查用户状态
        if (user.status === 'banned') {
            return res.status(403).json({ message: '账户已被禁用' });
        }

        // 验证密码
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: '用户名或密码错误' });
        }

        // 生成 JWT token
        const token = jwt.sign(
            { 
                userId: user.id, 
                username: user.username,
                is_admin: user.is_admin 
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: '登录成功',
            token,
            user: {
                id: user.id,
                username: user.username,
                is_admin: user.is_admin
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '服务器错误' });
    }
}; 