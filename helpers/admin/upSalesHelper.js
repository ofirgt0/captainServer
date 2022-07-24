var Pool = require('./../../core/db/dbPool')
const path = require('path');  
const fs = require("fs");
const usersDir = path.resolve(__dirname + './../../uploads/users')

const addUpSale = async function(IDsapak,upSale){  
    return new Promise(async (resolve, reject) => {
        Pool.query('INSERT INTO upSales (IDsapak, upsaleName, upsalePhoto, upsalePrice , upsaleInventory) VALUES ((?),(?),(?),(?),(?));',[IDsapak, upSale.upsaleName, upSale.upsalePhoto, upSale.upsalePrice , upSale.upsaleInventory], (err, row ,fields) => {
            if (err) return reject(err);
            if(row.affectedRows > 0){
                resolve({status : 'success' , IDupsale:row.insertId})
            }else{
                resolve({status : 'err'})
            }
        
        })
    })
}
 
const editUpSale = async function(IDsapak,upSale){  
    return new Promise(async (resolve, reject) => {
        Pool.query('UPDATE upSales SET upsaleName = (?), upsalePhoto = (?), upsalePrice = (?), upsaleInventory = (?) WHERE IDsapak = (?) And IDupsale = (?);',[upSale.upsaleName, upSale.upsalePhoto, upSale.upsalePrice , upSale.upsaleInventory , IDsapak, upSale.IDupsale ], (err, row ,fields) => {
            if (err) return reject(err);
            if(row.changedRows > 0){
                resolve({status : 'success'})
            }else{
                resolve({status : 'err'})
            }
        
        })
    })
}


const getAllUpSalesByIdSapak = async function(IDsapak){  
    return new Promise(async (resolve, reject) => {
        Pool.query('SELECT IDupsale,upsaleName,upsalePhoto,upsalePrice,upsaleInventory,soldUnits FROM upSales WHERE IDsapak = (?)',[IDsapak], (err, row ,fields) => {
            if (err) return reject(err);
            if(row.length > 0){
                resolve({status : 'success' , data:row})
            }else{
                resolve({status : 'err'})
            }
        })
    })
}

const deleteUpSale = async function(IDsapak,IDupsale){  
    return new Promise(async (resolve, reject) => {
        //upSale מחיקת תמונה של ה 
        Pool.query('SELECT upsalePhoto FROM upSales WHERE IDsapak = (?) AND IDupsale = (?)',[IDsapak,IDupsale], (err, row ,fields) => {
            if(row.length > 0){
                let UpSaleLocation =  path.resolve(usersDir + '/' +  IDsapak + '/upsale/' + row[0].upsalePhoto)
                if (fs.existsSync(UpSaleLocation)) {
                    fs.unlink(UpSaleLocation, function (err) {            
                        if (err) {                                                 
                            console.error(err);                                    
                        }                                                                                   
                    });      
                }
            }
            //upSale מחיקת  ה 
            Pool.query('DELETE FROM upSales WHERE IDsapak = (?) AND IDupsale = (?)',[IDsapak,IDupsale], (err, row ,fields) => {
                if (err) return reject(err);
                // console.log(row);
                if(row.affectedRows > 0){
                    resolve({status : 'success'})
                }else{
                    resolve({status : 'err'})
                }
            })

        })



    })
}


module.exports ={
    addUpSale,getAllUpSalesByIdSapak,deleteUpSale,editUpSale
}