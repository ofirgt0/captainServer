var Pool = require('./../../core/db/dbPool')
const GlobalFunction = require('./GlobalFunction')


const getAllTicketTypes = async function(IDsapak,IDiska){
    return new Promise((resolve, reject) => {
        let sql = `
        SELECT tt.IDticketType,tt.ttName,tt.IDsapak, ttpi.ttPrice, ttpi.ttDisplayOrder, ttpi.ticketsCountInside, EXISTS(SELECT IDticketType FROM ticketTypesPerIska WHERE IDticketType=tt.IDticketType AND IDiska=(?)) as selectedForIska FROM ticketTypes as tt LEFT JOIN ticketTypesPerIska as ttpi ON (tt.IDticketType=ttpi.IDticketType AND ttpi.IDiska=(?)) WHERE tt.IDsapak=(?) ORDER BY tt.ttName
        `
        Pool.query(sql,[IDiska,IDiska,IDsapak], (err, row ,fields) => {
            if (err) return reject(err);
            if(row.length > 0){
                resolve({status : 'success' , data:row })
            }
                resolve({status : 'err'})
        
        })
    })
}


const addTicketTypes = async function(IDsapak,Ticket){
    return new Promise((resolve, reject) => { 
        Pool.query('INSERT INTO ticketTypes (IDsapak, ttName) VALUES ((?),(?));',[IDsapak, Ticket.ttName], (err, row ,fields) => {
            if (err){
                console.log(err);
                return reject(err);
            } 
            if(row.affectedRows > 0){
                resolve({status : 'success' , IDticketType:row.insertId})
            }else{
                resolve({status : 'err'})
            }
        
        })
    })
}


const EditTicketTypes = async function(IDsapak,Ticket){
    return new Promise((resolve, reject) => {
        Pool.query('UPDATE ticketTypes SET ttName = (?) WHERE IDticketType = (?) And IDsapak = (?);',[Ticket.ttName,Ticket.IDticketType, IDsapak], (err, row ,fields) => {
            if (err){
                console.log(err);
                return reject(err);
            }
            if(row.affectedRows > 0){
                resolve({status : 'success'})
            }else{
                resolve({status : 'err'})
            }
        })
    })
}


const deleteTicketTypes = async function(IDsapak,IDticketType){
    return new Promise((resolve, reject) => {     
        Pool.query('DELETE FROM ticketTypes WHERE IDticketType = (?) And IDsapak = (?);',[IDticketType, IDsapak], (err, row ,fields) => {
            if (err) return reject(err);
            if(row.affectedRows > 0){
                resolve({status : 'success'})
            }else{
                resolve({status : 'err'})
            }
        })
    })
}



const getTicketTypePerIska = async function(IDsapak,IDiska,IDticketType){
    return new Promise(async(resolve, reject) => {

        let TicketTypePerIska = await GlobalFunction.getFields('ticketTypesPerIska','ttPrice,ttDisplayOrder',"WHERE IDiska = '" + IDiska+"' AND IDticketType = '" + IDticketType + "'")
        
        if(TicketTypePerIska == 'notFound'){
            let TicketName = await GlobalFunction.getFields('ticketTypes','ttName',"WHERE IDsapak = '" + IDsapak+"' AND IDticketType = '" + IDticketType + "'")
            if(TicketName == 'notFound'){
                TicketName = ""
            }else{
                TicketName = TicketName[0].ttName
            }
            console.log(TicketName);
            // לא נמצא כרטיס משויך לעסקה
            resolve({status : 'success' , details:'notFound' , TicketName:TicketName})
        }else{
            // נמצא כרטיס משויך לעסקה
            resolve({status : 'success' , details:'Found'})
        }        
    })
}

const addTicketPerIska = async function(IDsapak,IDiska,TicketPerIska){
    return new Promise(async(resolve, reject) => {  
        if(!TicketPerIska.ticketsCountInside){
            TicketPerIska.ticketsCountInside = 1
        }
        //ticketTypes כרטיס משולב הכנסה לטבלה 
        if(TicketPerIska.ticketsCountInside > 1){
            let res = await addTicketTypes(IDsapak,TicketPerIska)
            if(res.status == 'success'){
                TicketPerIska.IDticketType = res.IDticketType
            }else{
                resolve({status : 'err'})
            }
        }
        
        console.log(TicketPerIska);

        Pool.query('INSERT INTO ticketTypesPerIska (IDticketType,IDiska, ttPrice, ttDisplayOrder, ticketsCountInside) VALUES ((?),(?),(?),(?),(?));',[TicketPerIska.IDticketType, IDiska ,  TicketPerIska.ttPrice , TicketPerIska.ttDisplayOrder , TicketPerIska.ticketsCountInside], (err, row ,fields) => {
            if (err){
                console.log(err);
                return reject(err);
            } 
            if(row.affectedRows > 0){
                resolve({status : 'success'})
            }else{
                resolve({status : 'err'})
            }

        })
    })
}

const deleteTicketPerIska = async function(IDsapak,IDiska,IDticketType){
    return new Promise((resolve, reject) => {     
        Pool.query('DELETE FROM ticketTypesPerIska WHERE IDticketType = (?) And IDiska = (?);',[IDticketType,IDiska], (err, row ,fields) => {
            if (err) return reject(err);
            if(row.affectedRows > 0){
                resolve({status : 'success'})
            }else{
                resolve({status : 'err'})
            }
        })
    })
}




module.exports ={
    getAllTicketTypes , addTicketTypes , EditTicketTypes , deleteTicketTypes , getTicketTypePerIska , addTicketPerIska , deleteTicketPerIska
}