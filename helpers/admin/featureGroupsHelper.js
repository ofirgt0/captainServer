var Pool = require('./../../core/db/dbPool')

const getAllDefaultfeatureGroups = async function(IDsapak){  
        return new Promise((resolve, reject) => {
            Pool.query('select fgName from featureGroups WHERE IDsapak=0 and fgName NOT IN (select fgName from featureGroups WHERE IDsapak=(?))',[IDsapak], (err, row ,fields) => {
                if (err) return reject(err);
                if(row.length > 0){
                    resolve({status : 'success' , data:row })
                }
                    resolve({status : 'err'})
            })
    })
}





const getAllfeatureGroupsbyIDsapak = async function(IDiska,IDsapak){  
        return new Promise((resolve, reject) => {
            // שליפה של כל האפשרויות שמשויכות לעסקה
            Pool.query('select fg.IDfg from featureGroups as fg JOIN featureOptions as fo ON (fg.IDfg=fo.IDfg) JOIN featureOptionsPerIska as fopi ON (fo.IDfo=fopi.IDfo) where fopi.IDiska=(?) GROUP BY fg.IDfg',[IDiska], (err, selected ,fields) => {
                if (err) return reject(err);
                // שליפה של כל האפשרויות של הספק
                Pool.query('select IDfg,fgName from featureGroups WHERE IDsapak=(?)',[IDsapak], (err, row ,fields) => {
                    if (err) return reject(err);
                    if(row.length > 0){
                        resolve({status : 'success' , data:row , selected:selected})
                    }
                        resolve({status : 'err'})
                })


            })



    })
}

const deleteFeature = async function(IDsapak , IDfg){  
        return new Promise((resolve, reject) => {
            //  featureOptionsPerIska למחוק את כל מה שמושויך לעסקה מטבלה 
            // לפי IDiska לשלוח גם
            Pool.query('DELETE from featureGroups WHERE IDsapak = (?) AND IDfg = (?)',[IDsapak,IDfg], (err, row ,fields) => {
                if (err) return reject(err);
                if(row.affectedRows > 0){
                    resolve({status : 'success' , IDfg:IDfg })
                }
                    resolve({status : 'err'})
            })
    })
}


const CheckIffgNameExit = async function(IDsapak,Feature){  
    return new Promise(async (resolve, reject) => {
        Pool.query('select fgName from featureGroups WHERE IDsapak=(?) AND fgName = (?)',[IDsapak,Feature], (err, row ,fields) => {
            if (err) return reject(err);
            // console.log(row);
            if(row.length == 0){
                resolve(true)
            }else{
                resolve(false)
            }
        
        })
    })
}

const AddFeature = async function(IDsapak,Feature){  
    return new Promise(async (resolve, reject) => {
        let canCreate = await CheckIffgNameExit(IDsapak,Feature)
        if(!canCreate){
            resolve({status : 'err' , details:'fgName exit'})
            return
        }
        Pool.query('INSERT INTO featureGroups (IDsapak, fgName) VALUES ((?),(?));',[IDsapak,Feature], (err, row ,fields) => {
            if (err) return reject(err);
            if(row.affectedRows > 0){
                resolve({status : 'success' , IDfg:row.insertId})
            }else{
                resolve({status : 'err'})
            }
        
        })
    })
}

module.exports ={
    getAllDefaultfeatureGroups , AddFeature , getAllfeatureGroupsbyIDsapak , deleteFeature
}