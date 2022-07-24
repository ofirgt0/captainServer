var Pool = require('./../../core/db/dbPool')


const getAllShipments = async function(IDsapak){
    return new Promise((resolve, reject) => {
        Pool.query('SELECT IDshipment,shipmentName,shipmentPrice FROM shipments WHERE IDsapak = (?);',[IDsapak], (err, row ,fields) => {
            if (err) return reject(err);
            if(row.length > 0){
                resolve({status : 'success' , data:row })
            }
                resolve({status : 'err'})
        
        })
    })
}

const addShipment = async function(IDsapak , shipment){
    return new Promise((resolve, reject) => {
        Pool.query('INSERT INTO shipments (IDsapak, shipmentName, shipmentPrice) VALUES ((?),(?),(?));',[IDsapak, shipment.shipmentName, shipment.shipmentPrice], (err, row ,fields) => {
            if (err) return reject(err);
            if(row.affectedRows > 0){
                resolve({status : 'success' , IDshipment:row.insertId})
            }else{
                resolve({status : 'err'})
            }
        })
    })
}


module.exports ={
    getAllShipments , addShipment
}