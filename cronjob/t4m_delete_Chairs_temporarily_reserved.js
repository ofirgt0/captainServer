// פקודת הרצה לסקריפט
// 
// window development
// set NODE_ENV=development&& node t4m_delete_Chairs_temporarily_reserved
// linux prod
// export NODE_ENV=prod&& node t4m_delete_Chairs_temporarily_reserved

switch (process.env.NODE_ENV) {
    case 'development':
        console.log('run on development Mode');
        require('dotenv').config({ path: './../config/.env' });
    
        break;
    case 'prod':
        console.log('run on production Mode');
        require('dotenv').config({ path: './../config/.envProd' });
        break;
    
    }
    
console.log('DATABASE = ' ,process.env.DATABASE);

const Pool = require('./../core/db/dbPool')
const timeToDelete = '10 MINUTE'


const Main = async function(){

    let sql = "DELETE FROM chairs WHERE IDorder = 0 AND `timeStamp` <= NOW() - INTERVAL " + timeToDelete
    Pool.query(sql, (err, row ,fields) => {
        if (err){
            console.log(err);
            return reject(err);
        }
        console.log(row.affectedRows + ' Entries deleted successfully');
    })

}

Main()
