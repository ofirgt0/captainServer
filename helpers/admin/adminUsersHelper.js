const Pool = require('./../../core/db/dbPool')
const GlobalFunction = require('./GlobalFunction')


const addAdminUsersToDB = async function(IDsapak , userPhone , userName){
    return new Promise(async (resolve, reject) => {
        Pool.query('INSERT INTO adminUsers (IDsapak,userPhone,userName,userPermission,creationDate) VALUES ((?),(?),(?),(?),CURRENT_TIMESTAMP);',[IDsapak,userPhone,userName,'sapak-full'],async (err, row ,fields) => {
            if (err) return reject(err);
            if (row.affectedRows > 0){
                resolve({status : "success"})
            }else{
                resolve({status : "err"})
            }

            })
        })
}

const getAllAdminUserByIdSapak = async function(IDsapak){
    return new Promise(async (resolve, reject) => { 
        Pool.query("SELECT IDuser,userName FROM `adminUsers` WHERE `IDsapak` = (?) AND (`userPermission` = 'sapak-iskaot' OR userPermission = 'sapak-full') order by IDuser",[IDsapak],async (err, row ,fields) => {
            if (err) return reject(err);
            row.splice(0, 1);
            if (row.length > 0){
                resolve({status : "success" , data:row})
            }else{
                resolve({status : "err" , err:7439})
            }
        })
    })
}

const getUserDetailsByIdSapak = async function(IDsapak,IDuser){
    console.log(IDsapak,IDuser);
    return new Promise(async (resolve, reject) => { 
        let a = Pool.query("SELECT IDuser,userPhone,userName,userEmail,userPermission FROM `adminUsers` WHERE `IDsapak` = (?) AND IDuser = (?) AND (`userPermission` = 'sapak-iskaot' OR userPermission = 'sapak-full')",[IDsapak,IDuser],async (err, row ,fields) => {
            if (err) return reject(err);
            // console.log(a);
            if (row.length > 0){
                resolve({status : "success" , data:row[0]})
            }else{
                resolve({status : "err" , err:7440})
            }
        })
    })
}

const deleteUser = async function(IDsapak,IDuser){

    return new Promise(async (resolve, reject) => { 
        Pool.query("DELETE FROM `adminUsers` WHERE `IDsapak` = (?) AND IDuser = (?)",[IDsapak,IDuser],async (err, row ,fields) => {
            if (err) return reject(err);
            console.log(err, row );
            if (row.affectedRows > 0){
                resolve({status : "success"})
            }else{
                resolve({status : "err"})
            }
        })
    })
}



const saveUser = async function(IDsapak,UserDetails){
    return new Promise(async (resolve, reject) => { 
        if(UserDetails.IDuser){
            // ******************
            // עדכון משתמש
            // ******************
            // *** FIXME ***
            // לתקן וולידציה שמתמש לא יוכל להחליף את מספר הנייד שלו למספר שכבר קיים במערכת
            let validNumber = false
            let CheckIfPhoneExistsOnDb = await GlobalFunction.getFields('adminUsers','userPhone','where IDuser =' + UserDetails.IDuser )
            console.log(CheckIfPhoneExistsOnDb);
            if(CheckIfPhoneExistsOnDb != 'notFound'){
                // console.log(UserDetails.userPhone , CheckIfPhoneExistsOnDb[0].userPhone);
                if(UserDetails.userPhone == CheckIfPhoneExistsOnDb[0].userPhone){
                    console.log(1);
                    validNumber = true
                }else{
                    let CheckPhoneExists = await GlobalFunction.getFields('adminUsers','userPhone','where userPhone =' + UserDetails.userPhone )
                    console.log(CheckPhoneExists);
                    if(CheckPhoneExists == 'notFound'){
                        validNumber = true
                    }
                }
            }

            if(!validNumber){
                resolve({status : "err" , details:'userPhone is Exists'})
                return
            }

            Pool.query('UPDATE `adminUsers` SET `userPhone`=(?) , `userName`=(?) , `userEmail`=(?) , `userPermission`=(?) WHERE `IDsapak` = (?) AND `IDuser` = (?)',[UserDetails.userPhone,UserDetails.userName,UserDetails.userEmail,UserDetails.userPermission,IDsapak,UserDetails.IDuser],(err, row ,fields) => {
                if (row.affectedRows > 0){
                    resolve({status : "success"})
                }else{
                    resolve({status : "err"})
                }
            })
            
        }else{
            // ******************
            // משתמש חדש
            // ******************
            let CheckIfPhoneExistsOnDb = await GlobalFunction.getFields('adminUsers','userPhone','where userPhone =' + UserDetails.userPhone )
            if(CheckIfPhoneExistsOnDb != 'notFound'){
                resolve({status : "err" , details:'userPhone is Exists'})
                return
            }
            Pool.query('INSERT INTO adminUsers ( `IDsapak`, `userPhone`, `userName`, `userEmail`, `userPermission`,creationDate) VALUES ((?),(?),(?),(?),(?),CURRENT_TIMESTAMP);',[IDsapak,UserDetails.userPhone,UserDetails.userName,UserDetails.userEmail,UserDetails.userPermission],async (err, row ,fields) => {
                if (err) return reject(err);
                if (row.affectedRows > 0){
                    resolve({status : "success"})
                }else{
                    resolve({status : "err"})
                }
            })
        }
    })
}


module.exports ={
    addAdminUsersToDB , getAllAdminUserByIdSapak , getUserDetailsByIdSapak , saveUser , deleteUser
}