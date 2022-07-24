const mysql = require('mysql');

const Pool = mysql.createPool({
    host: '213.8.152.171',
    user: 'admin_ticket4',
    password: 'FqnHfGaDNQ',
    database: 'admin_ticket4me_DEV',
    port:3306,
    queueLimit : 0, // unlimited queueing
    connectionLimit : 0 // unlimited connections 
});

module.exports = Pool;