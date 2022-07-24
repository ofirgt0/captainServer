
const Pool = require('./../../core/db/dbPool')
const _ = require('underscore');
const GlobalFunction = require('./../../helpers/admin/GlobalFunction')

const Cryptr = require('cryptr');
const cryptr = new Cryptr(process.env.cryptr_SECRET);
// שימוש בפונק' הצפנה ופענוח
//cryptr.encrypt("text");
//cryptr.decrypt("hashed");


//קבלת מספר עסקה אחרונה במערכת
const updateCardcomTerminal = async function(url,result){  
    return new Promise(async(resolve, reject) => {
      console.log(url,result);
      resolve({a:1})
    })
}

module.exports ={
    updateCardcomTerminal
}