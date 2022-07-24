

var jwt = require('jsonwebtoken');
const globalFunction = require('./GlobalFunction')
var Pool = require('./../../core/db/dbPool')
const fs = require("fs");
const { now } = require('lodash');
//   Pool.on('connection' , (data)=>{
//       console.log(data);
//   })





// const RegisteredUserDetails = async function(userPhone){
//     return new Promise((resolve, reject) => {

//     })
// }



const refreshTokan = async function(IDsapak){
    return new Promise(async(resolve, reject) => {
        let row = await globalFunction.getFields('adminUsers' , 'userPermission' , "where IDsapak = '" +IDsapak+ "' order by IDsapak desc limit 1")
        console.log(row);
        let data = {
            IDsapak:IDsapak,
            userPermission : row[0].userPermission
        }
        let Token = await globalFunction.grantToken(data)
        resolve({Token:Token})
    })
}

const CheckIfIsDemoAccount = async function(IDsapak){
    return new Promise((resolve, reject) => {
        Pool.query('SELECT IDsapak,userPhone,userPermission FROM adminUsers WHERE IDsapak = (?);',[IDsapak], (err, row ,fields) => {
            if (err){
                console.log(err);
                return reject(err);
            }
            if(row.length > 0){
                if(row[0].userPermission == 'sapak-demo'){
                    resolve(true)
                }else{
                    resolve(false)
                }
            }
            resolve(false)
        })
    })
}

const CheckIfRegistered = async function(userPhone){
    return new Promise((resolve, reject) => {
        Pool.query('SELECT IDsapak,userPhone,userPermission FROM adminUsers WHERE userPhone = (?);',[userPhone], (err, row ,fields) => {
            if (err) return reject(err);
            if(row.length > 0){
                resolve({status : true , IDsapak:row[0].IDsapak , userPermission:row[0].userPermission})
            }else{
                resolve({status : false })
            }
        })
    })
}


 
const VerificationCode = async function(mobileCode , userPhone , userName , Token){

 
    return new Promise(async (resolve, reject) => {
        Pool.query('SELECT cusFirstNameToUpdate FROM SMScodes WHERE mobileCode = (?) AND mobileNumber = (?);',[mobileCode , userPhone],async (err, row ,fields) => {
            if (err) {
                console.log(err);
                return reject(err);
            }
            // הזדהות לא הצליחה
            if(row.length == 0){
                resolve({status : 'err'})
                return
            }

            
            //הזדהות הצליחה ממשיכים
           
            // בדיקה אם זה חשבון דמו
            let IsDemoAccount = false
            if(Token && Token.IDsapak){
                IsDemoAccount = await CheckIfIsDemoAccount(Token.IDsapak)
            }

      
    
            // אם לא חשבון דמו בדיקה רגילה
            if(!IsDemoAccount){
                let Registered = await CheckIfRegistered(userPhone)
                        
   
                if(Registered.status){
                    // משתמש רשום
                    tokenData = {IDsapak:Registered.IDsapak , userPermission:Registered.userPermission}
                    let Token = await globalFunction.grantToken(tokenData)
           
                    resolve({status : "success" , UserExist : true , Token:Token})
               
                }else{
                    // משתמש חדש
                    tokenData = {userPhone:userPhone , userPermission:'sapak-full'}
                    let Token = await globalFunction.grantToken(tokenData)
       
                    resolve({status : "success" , UserExist : false , Token:Token})
                }
            }else{
                // תהליך של חשבון דמו
                // הפיכת חשבון דמו לחשבון רגיל
                console.log('is demooooooooooooooo');
                let resDemoToSapakIskoat = await updateSapakDemoToSapakIskoat(Token.IDsapak,userPhone,userName)
                if(resDemoToSapakIskoat){
                    tokenData = {IDsapak:Token.IDsapak , userPermission:'sapak-full'}
                    jwt.sign(tokenData, process.env.JWT_SECRET, { expiresIn: '10h' } , function(err, Token) {
                        resolve({status : "success" , UserExist : false , Token:Token})
                    });
                }
            }

            // מחיקת רשומת אימות מהדאטה
            //בתאריך 14.10.2021: השורה סומנה בהערה כי מרגע זה רוצים כל מי 
            // Pool.query('DELETE FROM SMScodes WHERE mobileNumber = (?);',[userPhone],(err, row ,fields) => {})
            // אם לא חשבון דמו בדיקה רגילה
        })
    })
}


  
const checkLoginForm = async function(loginForm){
    userName = loginForm.userName
    userPhone = loginForm.userPhone
    return new Promise(async (resolve, reject) => {
        // התחברות למערכת רק לטלפונים מאושרים
        //                          shlomi, ehud, aviram, eilon, ofir, sharon
        /*
        VerifiedNumbersAccess = ['0508323234','0524022222','0507271400','0546707470','0502113342','0502300896'].includes(loginForm.userPhone)
        if(!VerifiedNumbersAccess && process.env.NODE_ENV == 'prod'){
            resolve({status : "err"})
            return
        }
        */
        await globalFunction.SendVerificationCode(userName , userPhone)
        resolve({status : "success"})
    })
}



const addSapakToDB = async function(addBusiness){
    console.log(addBusiness.sapakLogo);
    return new Promise(async (resolve, reject) => {
        Pool.query('INSERT INTO sapakim (sapakName,sapakMezahe,sapakLogo,sapakOwnerName,sapakPhone,sapakEmail,sapakFax,sapakFacebook,sapakYouTube,sapakInstegram) VALUES ((?),(?),(?),(?),(?),(?),(?),(?),(?),(?));',[addBusiness.sapakName,addBusiness.sapakMezahe,addBusiness.sapakLogo,addBusiness.sapakName,addBusiness.sapakPhone,addBusiness.sapakEmail,addBusiness.sapakFax,addBusiness.step2.sapakFacebook,addBusiness.step2.sapakYouTube,addBusiness.step2.sapakInstegram],async (err, row ,fields) => {
            if (err) return reject(err);
            if (row.affectedRows > 0){
                resolve({status : "success", insertId : row.insertId})
            }else{
                resolve({status : "err"})
            }

        })
    })
}
 


const addAdminUsersToDB = async function(addBusiness,SapakInsertId,userPhone){

    return new Promise(async (resolve, reject) => {
        Pool.query('INSERT INTO adminUsers (IDsapak,userPhone,userName,userEmail,userPermission,creationDate) VALUES ((?),(?),(?),(?),(?),CURRENT_TIMESTAMP);',[SapakInsertId,userPhone,addBusiness.sapakName,addBusiness.sapakEmail,'sapak-full'],async (err, row ,fields) => {
            if (err) return reject(err);
            if (row.affectedRows > 0){
                resolve({status : "success"})
            }else{
                resolve({status : "err"})
            }

        })
    })
}



const addBranchesToDB = async function(branch , SapakInsertId){
    return new Promise(async (resolve, reject) => {
        let allGood = true 
        for (let i = 0; i < branch.length; i++) {
            Pool.query('INSERT INTO sapakBranches (IDsapak,branchName,branchMezahe,branchAddress,branchContactPerson,branchPhone,branchFax,branchEmail,branchCCterminal,branchCCterminalType,branchCCterminalPwd,branchAreaCover,branchOpenHours) VALUES ((?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?));',[SapakInsertId,branch[i].branchName,branch[i].branchMezahe,branch[i].branchAddress,branch[i].branchContactPerson,branch[i].branchPhone,branch[i].branchFax,branch[i].branchEmail,branch[i].branchCCterminal,branch[i].branchCCterminalType,branch[i].branchCCterminalPwd,branch[i].branchAreaCover,branch[i].branchOpenHours],async (err, row ,fields) => {
                if (err) return reject(err);
                  if (row.affectedRows == 0){
                    allGood = false
                  }
            })
        }
        if (allGood){
            resolve({status : "success"})
        }else{
            resolve({status : "err"})
        }
    })
}
 


const saveBusinessToServer = async function(addBusiness , userPhone){
    /**
     * to do
     * Add validation
     */
    return new Promise(async (resolve, reject) => {
        
      

        // יצירת ספק חדש
        let addSapak = await addSapakToDB(addBusiness)
       
        if(addSapak.status == "err"){
            resolve({status : "err"})
        }
        
        // פתיחה של משתמש
        let addAdminUsers = await addAdminUsersToDB(addBusiness,addSapak.insertId , userPhone)
        if(addAdminUsers.status == "err"){
            resolve({status : "err"})
        }

        // פתיחה והעברה של מדיה לתיקית משתמש
        let addMadie = await addMadieFolder(addBusiness,addSapak.insertId)
        if(addMadie.status == "err"){
            resolve({status : "err"})
        }

        // הוספת סניפים
        let addBranches = await addBranchesToDB(addBusiness.branch,addSapak.insertId)
        if(addBranches.status == "err"){
            resolve({status : "err"})
        }
        let data = {
            IDsapak:addSapak.insertId,
            userPermission : 'sapak-full'
        }
        let Token = await globalFunction.grantToken(data)
        resolve({status : "success" , Token : Token})
        
    })

    // console.log(addBusiness , userPhone);

}



const getSapakLogoAndSapakName = async function(IDsapak ){
    return new Promise(async (resolve, reject) => {
        Pool.query('SELECT sapakLogo,sapakName FROM sapakim where IDsapak = (?);',[IDsapak],async (err, row ,fields) => {
            if (err) return reject(err);
                if (row.length > 0){
                resolve({status : "success" , data : row[0]})
            }else{
                resolve({status : "err" })
                }
        })
    })
}








// *****************************************
// *************** DEMO ********************
// *****************************************


const addDemoAdminUsersToDB = async function(addBusiness,SapakInsertId,userPhone){

    return new Promise(async (resolve, reject) => {
        Pool.query('INSERT INTO adminUsers (IDsapak,userPhone,userName,userEmail,userPermission,createdDate) VALUES ((?),(?),(?),(?),(?),CURRENT_TIMESTAMP);',[SapakInsertId,userPhone,addBusiness.sapakName,addBusiness.sapakEmail,'sapak-demo'],async (err, row ,fields) => {
            if (err) return reject(err);
            if (row.affectedRows > 0){
                resolve(true)
            }else{
                resolve(false)
            }

        })
    })
}

const updateSapakDemoToSapakIskoat = async function(IDsapak,userPhone,userName){
    return new Promise(async (resolve, reject) => {
        var sapakNextPayDay = new Date(Date.now());
        // עדכון תאריך תשלום להיום
        Pool.query("UPDATE `sapakim` SET `sapakNextPayDay`=(?) WHERE IDsapak = (?)",[sapakNextPayDay,IDsapak],async (err, row ,fields) => {
            if (err){
                console.log(err);
                return reject(err);
            } 
            if (row.affectedRows > 0){
                // עדכון שם פלאפון והרשאות ספק
                Pool.query("UPDATE `adminUsers` SET `userPhone`=(?), `userName`=(?), `userPermission`= (?) WHERE IDsapak = (?)",[userPhone,userName,'sapak-full',IDsapak],async (err, row ,fields) => {
                    if (err){
                        console.log(err);
                        return reject(err);
                    } 
                    if (row.affectedRows > 0){
                        resolve(true)
                    }else{
                        resolve(false)
                    }
                })
                
            }else{
                resolve(false)
            }
        })






    })
}


const getUsersWithIncompletedRegistration = async function(fromDate,toDate){
    return new Promise((resolve, reject) => {
        if(fromDate ==undefined && toDate==undefined){
            //12096e5 equals to two weeks in milliseconds.
            fromDate = new Date(Date.now()-12096e5);
            toDate = new Date();
        } 
        // console.log('from '+fromDate);
        // console.log('to '+toDate);
        let queryString = 'SELECT IDx as ID, cusFirstNameToUpdate as customerName,codeExpires As creationDate,mobileNumber,\'incompleteRegistration\' as type FROM SMScodes where (codeExpires >= (?) and ((?) is null or codeExpires >= (?)))';
        queryString += ' union ';
        queryString += 'SELECT IDUser as ID,userName as customerName,creationDate,userPhone as mobileNumber,userPermission as type FROM adminUsers where isActive=true and userPermission<>\'superadmin\'';
        Pool.query(queryString,[fromDate,toDate,toDate],
        (err, row ,fields) => {
            if (err){
                console.log(err);
                return reject(err);
            }
            if(row.length > 0){
                    resolve({status:'ok',data:row});
            }
            resolve({status:'ok',data:[]});
        });
    });
}


const getTokenForDemoMode = async function(){
    return new Promise(async (resolve, reject) => {
        
        var sapakNextPayDay = new Date();
        sapakNextPayDay.setMonth(sapakNextPayDay.getMonth() + 1);
   

        Pool.query('INSERT INTO sapakim (sapakCCnumber,sapakCCexpiration,sapakCCcvv,sapakCCidnumber,sapakNextPayDay,packageType) VALUES ((?),(?),(?),(?),(?),(?));',[0 , 0 , 0 , 0 , sapakNextPayDay , 'fixedPrice'],async (err, row ,fields) => {
            if (err) return reject(err);
            if (row.affectedRows > 0){
                let addBusiness = {
                    sapakName:'משתמש דמו',
                    sapakEmail:'user@demo.co.il'
                }
                let userPhone = '001999'
                let RandNumber = await globalFunction.getRandNumber(4,'adminUsers','userPhone',false)
                userPhone = userPhone + RandNumber
                
                let addDemoAdminUsersToDBRes = await addDemoAdminUsersToDB(addBusiness,row.insertId,userPhone)
                if(!addDemoAdminUsersToDBRes){
                    resolve({status : "err" , details:7777})
                    return
                }

                
                // console.log("dateExpiration",new Date(dateExpiration));
                let data = {
                    IDsapak:row.insertId,
                    userPermission : 'sapak-demo',
                    // dateExpirationDemo: now() + 60 //added the date until which sapak-demo is working
                    dateExpirationDemo: now() + 60*60*24 //added the date until which sapak-demo is working
                }
                let Token = await globalFunction.grantToken(data)
                resolve({status : "success" , Token : Token})

            }else{
                resolve({status : "err" , details:7778})

            }
        })

    })
}

// *****************************************
// *************** DEMO ********************
// *****************************************









module.exports ={

    checkLoginForm , VerificationCode , saveBusinessToServer , getSapakLogoAndSapakName , getTokenForDemoMode , updateSapakDemoToSapakIskoat,refreshTokan,getUsersWithIncompletedRegistration
   
}