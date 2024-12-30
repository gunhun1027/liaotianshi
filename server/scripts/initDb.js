const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('../config/database');

const initDatabase = async () => {
    try {
        // 读取SQL文件
        const sqlFile = path.join(__dirname, '../models/init.sql');
        let sql = fs.readFileSync(sqlFile, 'utf8');

        // 生成管理员密码的哈希值
        const adminPassword = 'admin123';
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        
        // 替换SQL文件中的密码占位符
        sql = sql.replace('$ADMIN_PASSWORD_HASH', hashedPassword);

        // 按语句分割SQL
        const statements = sql.split(';').filter(stmt => stmt.trim());

        // 依次执行每个SQL语句
        for (let statement of statements) {
            if (statement.trim()) {
                await db.query(statement);
                console.log('执行SQL语句成功');
            }
        }

        console.log('数据库初始化成功！');
        console.log('默认管理员账户：');
        console.log('用户名: admin');
        console.log('密码: admin123');
        process.exit(0);
    } catch (error) {
        console.error('数据库初始化失败:', error);
        process.exit(1);
    }
};

initDatabase(); 