const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'mysql.sqlpub.com',
    port: 3306,
    user: 'gunhun_liaotian',
    password: 'y6QJDIFwjJpwQFPT',
    database: 'gunhun_liaotian',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const promisePool = pool.promise();

module.exports = promisePool; 