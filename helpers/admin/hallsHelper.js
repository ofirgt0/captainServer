var Pool = require('./../../core/db/dbPool')
var GlobalFunction = require('./../../helpers/admin/GlobalFunction')
const _ = require('underscore');






const AddHallToDb = async function(IDsapak,hallName,IDIskaot){
    return new Promise(async (resolve, reject) => {
        let sql = "INSERT INTO `halls`(`IDsapak`, `hallName`, `IDIskaot`) VALUES ((?),(?),(?))"
        Pool.query(sql, [IDsapak,hallName,IDIskaot] , async (err, row ,fields) => {
            if(err){
                console.log(err);
                reject(err)
            }
            resolve(row.insertId)
        })
    })
}

const addAllSeats = async function(IDsapak,IDhall,hallStructure){
    return new Promise(async (resolve, reject) => {
        let sql = "INSERT INTO `hallsMatrix`( `IDsapak`, `IDhall`, `widthLocation`, `lengthLocation`, `IDchairStatus`, `chairName`) VALUES "
       
        if(hallStructure.seat.length == 0){
            resolve('ok')
            return
        }
        hallStructure.seat.forEach(element => {
            console.log(element);
            sql += "('"+IDsapak+"','"+IDhall+"','"+element.widthLocation+"','"+element.lengthLocation+"','"+element.IDchairStatus+"','"+element.chairName+"'),"
        });
        sql = sql.slice(0, -1)
        
        Pool.query(sql , async (err, row ,fields) => {
            if(err){
                console.log(err);
                reject(err)
            }
            resolve('ok')
        })
    })
}

const saveHallStructure = async function(IDsapak,hallStructure){
    return new Promise(async (resolve, reject) => {

        console.log(IDsapak,hallStructure);

        
        let IDhall = await AddHallToDb(IDsapak,hallStructure.hallName,hallStructure.IDIskaot)
        await addAllSeats(IDsapak,IDhall,hallStructure)
        
        resolve({status : "success" , IDhall:IDhall})
        
     
        
        // hallStructureBYchairStatus = _.groupBy(hallStructure, function(ele){
        //     return ele.IDchairStatus
        // });
        // Object.keys(hallStructureBYchairStatus).forEach((key)=>{
        //     console.log(key , hallStructureBYchairStatus[key].length);
        // })
        // console.log(IDsapak,hallStructure);
            // Pool.query('SELECT * FROM iskaCategories WHERE categoryGroup=(?) ORDER BY IDcategory, IDparent', [iskaType] , async (err, row ,fields) => {
            //     if (err) return reject(err);
            //     if (row.length > 0){
                    
            //     }else{
            //         resolve({status : "err" })

            //     }
            // })
    })
}



const getSeatCounter = async function(IDsapak,IDhall){
    return new Promise(async (resolve, reject) => {
        let sql = "SELECT COUNT(IDchair) FROM `hallsMatrix` where IDhall = (?) AND (IDchairStatus = 20 or IDchairStatus = 30 or IDchairStatus = 40 or IDchairStatus = 50 or IDchairStatus = 60)"
        Pool.query(sql, [IDhall] , async (err, row ,fields) => {
            if(err){
                console.log(err);
                reject(err)
            }
            let Counter = row[0]['COUNT(IDchair)']
            if(Counter == 0){
                resolve({status : "err" , Counter:0 })
            }else{
                resolve({status : "success" , Counter:Counter })
            }
        })
    })
}

const getAllHallByIdSapak = async function(IDsapak){
    return new Promise(async (resolve, reject) => {
        let sql = "SELECT IDhall,hallName FROM `halls` WHERE IDsapak = (?)"
        Pool.query(sql, [IDsapak] , async (err, row ,fields) => {
            if(err){
                console.log(err);
                reject(err)
            }
            resolve({status : "success" , date:row })
        })
    })
}


module.exports ={
    saveHallStructure , getAllHallByIdSapak , getSeatCounter

}