var Pool = require('./../../core/db/dbPool')


const getAllCategory = async function(iskaType){
    return new Promise(async (resolve, reject) => {
        
            Pool.query('SELECT * FROM iskaCategories WHERE categoryGroup=(?) ORDER BY IDcategory, IDparent', [iskaType] , async (err, row ,fields) => {
                if (err) return reject(err);
                if (row.length > 0){
                    
                    resolve({status : "success" , data:row})
                }else{
                    resolve({status : "err" })

                }
            })
    })
}

module.exports ={
    getAllCategory

}