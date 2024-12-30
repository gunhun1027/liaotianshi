const db = require('../config/database');

exports.getRooms = async (req, res) => {
    try {
        const [rooms] = await db.query('SELECT * FROM chat_rooms ORDER BY created_at DESC');
        res.json(rooms);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '获取聊天室列表失败' });
    }
};

exports.createRoom = async (req, res) => {
    try {
        const { name } = req.body;
        const userId = req.user.id; // 从JWT中获取用户ID

        const [result] = await db.query(
            'INSERT INTO chat_rooms (name, created_by) VALUES (?, ?)',
            [name, userId]
        );

        const [newRoom] = await db.query(
            'SELECT * FROM chat_rooms WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json(newRoom[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '创建聊天室失败' });
    }
};

exports.getMessages = async (req, res) => {
    try {
        const { roomId } = req.params;
        const [messages] = await db.query(
            `SELECT m.*, u.username 
             FROM messages m 
             JOIN users u ON m.user_id = u.id 
             WHERE m.room_id = ? 
             ORDER BY m.created_at ASC`,
            [roomId]
        );
        res.json(messages);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '获取消息失败' });
    }
}; 