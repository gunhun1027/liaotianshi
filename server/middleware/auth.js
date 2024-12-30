const jwt = require('jsonwebtoken');

const JWT_SECRET = 'your-secret-key'; // 使用与authController中相同的密钥

module.exports = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ message: '未提供认证令牌' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = {
            id: decoded.userId,
            username: decoded.username,
            is_admin: decoded.is_admin
        };
        next();
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({ message: '无效的认证令牌' });
    }
}; 