-- 删除现有表
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS chat_rooms;
DROP TABLE IF EXISTS users;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    display_name VARCHAR(50),
    avatar_url VARCHAR(255),
    birthday DATE,
    is_admin BOOLEAN DEFAULT FALSE,
    status ENUM('active', 'banned') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建默认管理员账户（密码：admin123）
INSERT INTO users (username, email, password, display_name, is_admin) 
VALUES ('admin', 'admin@example.com', '$2a$10$bUnwTcQ0xMQz9/Lzfc49xecZgCvkzY5bSs1ovWa0K1XxPBgYCHugm', '管理员', TRUE)
ON DUPLICATE KEY UPDATE password='$2a$10$bUnwTcQ0xMQz9/Lzfc49xecZgCvkzY5bSs1ovWa0K1XxPBgYCHugm';

-- 消息表
CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    content TEXT NOT NULL,
    status ENUM('active', 'deleted') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
); 