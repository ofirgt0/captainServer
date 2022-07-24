var Pool = require('./../../core/db/dbPool')


const SaveFeatureOptionsToiska = async function(IDsapak,IDiska,IDfg,SelectedFeatureOptionsPerIska){
    return new Promise(async (resolve, reject) => {
        Pool.query('DELETE FROM featureOptionsPerIska WHERE IDiska = (?) AND IDfo IN '+'('+'SELECT IDfo From featureOptions WHERE IDfg = (?)'+');',[IDiska,IDfg], (err, row ,fields) => {
            if (err){
                console.log(err);
                return reject(err);
            }
            let allGood = true
            if(SelectedFeatureOptionsPerIska.length == 0){
                resolve({status : 'success'})
                return
            }
            let sql = "INSERT INTO featureOptionsPerIska (IDfo, IDsapak, IDiska, foPrice, isPrecentage, foInventory) VALUES"
            for (let i = 0; i < SelectedFeatureOptionsPerIska.length; i++) {
                sql += ' (('+SelectedFeatureOptionsPerIska[i].IDfo+'),('+IDsapak+'),('+IDiska+'),('+SelectedFeatureOptionsPerIska[i].foPrice+'),('+SelectedFeatureOptionsPerIska[i].isPrecentage+'),('+SelectedFeatureOptionsPerIska[i].foInventory+')),'
            }
            sql = sql.slice(0, -1)
            Pool.query(sql, (err, row ,fields) => {
                if (err){
                    console.log(err);
                    return reject(err);
                }
                resolve({status : 'success'})
            })
        })

    })
}



module.exports ={
    SaveFeatureOptionsToiska
}