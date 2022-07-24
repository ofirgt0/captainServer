// פקודת הרצה לסקריפט
// window development
// set NODE_ENV=development&& node t4m_delete_demo_accounts
// linux prod
// export NODE_ENV=prod&& node t4m_delete_demo_accounts


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

console.log('NODE_ENV = ' , process.env.NODE_ENV);
console.log('NODE_ENV = ' , process.env.DATABASE);


const Pool = require('./../core/db/dbPool')
const GlobalFunction = require('./../helpers/admin/GlobalFunction')
const timeToDelete = '6 HOUR'

const getAllSapakDemo = async function(){  
    return new Promise((resolve, reject) => {
        let sql = "SELECT sapakim.IDsapak FROM sapakim LEFT JOIN adminUsers ON(sapakim.IDsapak = adminUsers.IDsapak) WHERE adminUsers.userPermission = 'sapak-demo' AND `crerationDate` <= NOW() - INTERVAL " + timeToDelete
        Pool.query(sql, (err, row ,fields) => {
            if (err){
                console.log(err);
                return reject(err);
            }
            resolve(row)
        })
    })
}


const DeleteAllByIDsapak = async function(IDsapak){
    return new Promise(async (resolve, reject) => {
        let sql = ""
        sql += "DELETE FROM `adminUsers` WHERE `IDsapak` = " + IDsapak +";"
        sql += "DELETE FROM `coupons` WHERE `IDsapak` = " + IDsapak +";"
        sql += "DELETE FROM `featureGroups` WHERE `IDsapak` = " + IDsapak +";"
        sql += "DELETE FROM `featureOptions` WHERE `IDsapak` = " + IDsapak +";"
        sql += "DELETE FROM `featureOptionsPerIska` WHERE `IDsapak` = " + IDsapak +";"
        sql += "DELETE FROM `inlays` WHERE `IDsapak` = " + IDsapak +";"
        sql += "DELETE FROM `iskaot` WHERE `IDsapak` = " + IDsapak +";"
        sql += "DELETE FROM `sapakBranches` WHERE `IDsapak` = " + IDsapak +";"
        sql += "DELETE FROM `sapakim` WHERE `IDsapak` = " + IDsapak +";"
        sql += "DELETE FROM `shipments` WHERE `IDsapak` = " + IDsapak +";"
        sql += "DELETE FROM `upSales` WHERE `IDsapak` = " + IDsapak +";"
        sql += "DELETE FROM `ticketTypes` WHERE `IDsapak` = " + IDsapak +";"
        Pool.query(sql, (err, row ,fields) => {
            if (err){
                console.log(err);
                return reject(err);
            }
            resolve('Delete Success IDsapak = ' + IDsapak)
        })  
    })
}



const Main = async function(){
    let SapakDemo = await getAllSapakDemo()
    if(SapakDemo.length == 0){
        console.log('did not find any sapak to delete');
    }
    await SapakDemo.forEachAsync(async(element) => {
        let res = await DeleteAllByIDsapak(element.IDsapak)
        console.log(res);
    });
}

Main()
