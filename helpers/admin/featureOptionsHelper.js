var Pool = require('./../../core/db/dbPool')

const getAllfeatureOptionsByIDfg = async function(IDiska,IDfg){
    return new Promise(async (resolve, reject) => {
        //IDiska ל לתקן להוציא משאילתה או לעשות וולידציה  
        // sql = 'SELECT featureOptions.IDfo, featureOptions.IDfg, featureOptions.foName, featureOptionsPerIska.foPrice, featureOptionsPerIska.isPrecentage ,featureOptionsPerIska.foInventory, EXISTS(SELECT idx FROM featureOptionsPerIska WHERE IDfo=featureOptions.IDfo AND IDiska='+IDiska+') as selectedForIska FROM featureOptions LEFT JOIN featureOptionsPerIska ON (featureOptions.IDfo = featureOptionsPerIska.IDfo) WHERE featureOptions.IDfg=(?) GROUP BY featureOptions.foName'
        sql = 'SELECT fo.IDfo, fo.IDfg, fo.foName, fopi.foPrice, fopi.isPrecentage ,fopi.foInventory, EXISTS(SELECT idx FROM featureOptionsPerIska WHERE IDfo=fo.IDfo AND IDiska=(?)) as selectedForIska FROM featureOptions as fo LEFT JOIN featureOptionsPerIska as fopi ON (fo.IDfo=fopi.IDfo AND fopi.IDiska=(?)) WHERE fo.IDfg=(?) ORDER BY fo.foName'
        Pool.query(sql,[IDiska,IDiska,IDfg], (err, row ,fields) => {
            if (err) return reject(err);
            if(row.length >= 0){
                resolve({status : 'success' , data:row })
            }else{
                resolve({status : 'err' })
            }
        
        })
    })
}

// isPrecentage
// האם סימן שהאפשרות באחוזים ממחיר הבסיס? TRUE=עלות באחוזים ממחיר הבסיס, FALSE=מחיר בשקלים (או מטבע אחר)

const CheckIfFeatureNameExit = async function(IDsapak,IDfg,foName){
    return new Promise(async (resolve, reject) => {
        Pool.query('select IDfg from featureOptions WHERE IDsapak=(?) AND IDfg = (?) AND foName = (?)',[IDsapak,IDfg,foName], (err, row ,fields) => {
            if (err) return reject(err);
            if(row.length > 0){
                resolve(true)
            }else{
                resolve(false)
            }
        })
    })
}

const addFeatureOptions = async function(IDsapak,IDfg,foName){
    return new Promise(async (resolve, reject) => {
        let foNameExit = await CheckIfFeatureNameExit(IDsapak,IDfg,foName)
 
        if(foNameExit){
            resolve({status : 'err' , details:'foName exit'})
            return
        }

        Pool.query('INSERT INTO featureOptions (IDsapak, IDfg, foName) VALUES ((?),(?),(?));',[IDsapak,IDfg,foName], (err, row ,fields) => {
            if (err) return reject(err);
            if(row.affectedRows > 0){
                resolve({status : 'success' , IDfo:row.insertId})
            }else{
                resolve({status : 'err'})
            }
        })
    })
}



const getFoodIngredients = async function(IDiska,IDsapak){
    return new Promise(async (resolve, reject) => {
        console.log(IDiska,IDsapak);

        sql = 'SELECT fo.IDfo, fo.IDfg, fo.foName,fo.foPhotoFile, fopi.foPrice, fopi.isPrecentage ,fopi.foInventory, EXISTS (SELECT idx FROM featureOptionsPerIska WHERE IDiska=(?) and IDfo=fo.IDfo) as selectedForIska FROM featureOptions as fo LEFT JOIN featureOptionsPerIska as fopi ON (fo.IDfo=fopi.IDfo) WHERE fo.IDsapak = (?) AND fo.IDfg=0 GROUP BY fo.IDfo ORDER BY fo.foName'
        
        Pool.query(sql,[IDiska,IDsapak], (err, row ,fields) => {
            if (err){
                console.log(err);
                return reject(err);
            } 
            if(row.length >= 0){
                resolve({status : 'success' , data:row })
            }else{
                resolve({status : 'err' })
            }
        
        })
    })
}


const AddFoodIngredients = async function(IDsapak,FoodOneIngredients){
    return new Promise(async (resolve, reject) => {
        
        console.log(IDsapak,FoodOneIngredients);
        sql = "INSERT INTO `featureOptions`(`IDfg`, `IDsapak`, `foName`, `foPhotoFile`) VALUES ((0),(?),(?),(?))"
        Pool.query(sql,[IDsapak,FoodOneIngredients.foName,FoodOneIngredients.foPhotoFile], (err, row ,fields) => {
            if (err) return reject(err);
            resolve({status : 'success'})
        })
    })
}



const saveFoodIngredientsForIska = async function(IDsapak,IDiska,FoodIngredients){
    return new Promise(async (resolve, reject) => {
        console.log(IDsapak,IDiska,FoodIngredients);
        sql = "DELETE FROM `featureOptionsPerIska` WHERE `IDiska` = (?)"
        Pool.query(sql,[IDiska], (err, row ,fields) => {
            console.log('נמחקו = ' , row.affectedRows);
            FoodIngredients.forEachAsync(async (element) => {
                sql = "INSERT INTO `featureOptionsPerIska`(`IDfo`, `IDsapak`, `IDiska`, `foPrice`, `isPrecentage`, `foInventory`) VALUES ((?),(?),(?),(?),(0),(9999999))"
                Pool.query(sql,[element.IDfo,IDsapak,IDiska,element.foPrice], (err, row ,fields) => {
                    if (err){
                        console.log(err);
                        return reject(err);
                    } 
                })
            })
        
        })

        resolve({status : 'success'})

        

    })
}



// ********************************************






// const gatAllfeatureGroupsByIDfg = async function(IDsapak,IDfg){

//     return new Promise(async (resolve, reject) => {
//         Pool.query('select * from featureOptions WHERE IDsapak=(?) AND IDfg = (?)',[IDsapak,IDfg], (err, row ,fields) => {
//             if (err) return reject(err);
//             if(row.length > 0){
//                 resolve({status : 'success' , data:row })
//             }else{
//                 resolve({status : 'err' })
//             }
//         })
//     })
// }


// 'SELECT *.fo, idx.fopi FROM featureOptions as fo LEFT JOIN featureOptions as fopi ON (fo.IDfo=fopi.IDfo)'

// const addFeatureGroupsToiska = async function(IDsapak,IDfg){  
//     return new Promise(async (resolve, reject) => {
//         let IDfgExit = await CheckIfIDfgExitInIska(IDsapak,IDfg)
//         if(IDfgExit){
//             // מצב שקים בעסקה לעשות כאן שאילתה מחיקה
//             Pool.query('DELETE from featureOptions WHERE IDsapak = (?) AND IDfg = (?)',[IDsapak,IDfg], (err, row ,fields) => {
//                 if (err) return reject(err);
//                 if(row.affectedRows > 0){
//                     resolve({status : 'success' , IDfg:IDfg })
//                 }
//                     resolve({status : 'err'})
//             })
//         }else{
//             // מצב שאופציה לא קיימת בעסקה מוסיף אותה לטבלת אפשרויות
//             Pool.query('INSERT INTO featureOptions (IDsapak, IDfg) VALUES ((?),(?));',[IDsapak,IDfg], (err, row ,fields) => {
//                 if (err) return reject(err);
//                 if(row.affectedRows > 0){
//                     resolve({status : 'success'})
//                 }else{
//                     resolve({status : 'err'})
//                 }
            
//             })
//         }


//     })
// }


module.exports ={
     getAllfeatureOptionsByIDfg , addFeatureOptions , getFoodIngredients , AddFoodIngredients , saveFoodIngredientsForIska
}