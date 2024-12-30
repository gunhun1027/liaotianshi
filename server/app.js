const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const db = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 路由配置
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/api/user', userRoutes);

// 用户连接处理
io.on('connection', (socket) => {
    console.log('用户已连接:', socket.id);

    // 处理加入聊天室
    socket.on('joinRoom', () => {
        socket.join('main');
        io.to('main').emit('message', {
            user: 'system',
            text: `新用户加入了聊天室`
        });
    });

    // 处理消息
    socket.on('sendMessage', async (data) => {
        try {
            // 获取用户信息
            const [users] = await db.query(
                'SELECT avatar_url, display_name FROM users WHERE id = ?',
                [data.userId]
            );
            const user = users[0];

            // 保存消息到数据库
            await db.query(
                'INSERT INTO messages (user_id, content) VALUES (?, ?)',
                [data.userId, data.text]
            );

            io.to('main').emit('message', {
                user: user.display_name || data.user,
                text: data.text,
                userId: data.userId,
                avatarUrl: user.avatar_url,
                time: data.time
            });
        } catch (err) {
            console.error('发送消息失败:', err);
        }
    });

    // 处理断开连接
    socket.on('disconnect', () => {
        console.log('用户断开连接:', socket.id);
    });
});

// 测试数据库连接
db.query('SELECT 1')
    .then(() => console.log('数据库连接成功'))
    .catch(err => console.error('数据库连接失败:', err));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
}); 