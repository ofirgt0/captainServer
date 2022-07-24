const mysql = require('mysql');

const Pool = mysql.createPool({
    host: process.env.DBHOST,
    user: process.env.USERDB,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
    port:parseInt(process.env.DBPORT),
    queueLimit : 0, // unlimited queueing
    connectionLimit : 0, // unlimited connections 
    multipleStatements: true
});


module.exports = Pool;

