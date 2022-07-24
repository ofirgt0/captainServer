var Pool = require('./../../core/db/dbPool')



const getReport = async function(param){
    return new Promise(async (resolve, reject) => {
            resolve({status : 'success', data:{param} })
    })
    // return {status:"success", data:{param}}
}

module.exports ={
    getReport
}