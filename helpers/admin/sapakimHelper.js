
const Pool = require('./../../core/db/dbPool')
const GlobalFunction = require('./GlobalFunction')
const Cryptr = require('cryptr');
const cryptr = new Cryptr(process.env.cryptr_SECRET);
const axios = require('axios');
const adminUsersHelper = require('./../../helpers/admin/adminUsersHelper');
const globalFunction = require('./../../helpers/admin/GlobalFunction');
const { get } = require('lodash');



const checkAddSapakStep = async function(IDsapak){

    return new Promise(async (resolve, reject) => {
        
        
        if(!IDsapak){
            resolve({status: "success" , step : 0 })
        }

        Pool.query('SELECT sapakim.sapakCCnumber,sapakim.sapakName,sapakim.sapakMezahe,adminUsers.userPhone,adminUsers.userName FROM sapakim LEFT JOIN adminUsers ON adminUsers.IDsapak=sapakim.IDsapak WHERE sapakim.IDsapak = (?);',[IDsapak], (err, row ,fields) => {
            if (err) return reject(err);
            if(row.length > 0){
                let data = { userPhone:row[0].userPhone , sapakName:row[0].sapakName }
                resolve({status: "success" , step : 0 , data:data })
            }
        })
    })
}



const getSapakDetails = async function(IDsapak){
    return new Promise(async (resolve, reject) => {
        Pool.query('SELECT sapakim.sapakName,sapakim.sugMezahe,sapakim.sapakMezahe,sapakim.sapakLogo,sapakim.sapakOwnerName,sapakim.sapakPhone,sapakim.sapakEmail,sapakim.sapakFax,sapakim.sapakFacebook,sapakim.sapakYouTube,sapakim.sapakInstegram,sapakim.packageType,adminUsers.userName,adminUsers.userPhone,sapakBranches.IDbranch  FROM sapakim LEFT JOIN adminUsers ON adminUsers.IDsapak=sapakim.IDsapak LEFT JOIN sapakBranches ON sapakBranches.IDsapak=sapakim.IDsapak WHERE sapakim.IDsapak = (?);',[IDsapak], (err, row ,fields) => {
            if(err){
                reject(err)
                console.log(err)
            }
            if(!row){
                resolve({status : "err"})
                return
            }
            if (row.length > 0){
                resolve({status : "success", data : row[0]})
            }else{
                resolve({status : "err"})
            }
        })
    })
}


const getSapakStatus = async function(IDsapak){
    console.log('IDsapak1234512',getSapakStatus);
    return new Promise(async (resolve, reject) => {
        if(!IDsapak){
            resolve({status:'Need Pay'})
            return
        }
        Pool.query('SELECT sapakim.sapakName,sapakim.sapakMezahe,sapakim.sapakLogo,sapakim.sapakOwnerName,sapakim.sapakPhone,sapakim.sapakEmail,sapakim.sapakFax,sapakim.sapakFacebook,sapakim.sapakYouTube,sapakim.sapakInstegram,sapakim.sapakNextPayDay,sapakim.packageType,adminUsers.userName,adminUsers.userPhone,sapakBranches.IDbranch  FROM sapakim LEFT JOIN adminUsers ON adminUsers.IDsapak=sapakim.IDsapak LEFT JOIN sapakBranches ON sapakBranches.IDsapak=sapakim.IDsapak WHERE sapakim.IDsapak = (?);',[IDsapak], (err, row ,fields) => {
            if(err){
                console.log(err);
                reject(err)
            }
            if (row.length > 0){
                console.log(IDsapak);
                
                // if(row[0].packageType.startsWith('periodic') || row[0].packageType.startsWith('percentages') ){
                    // בדיקה שלא עבר תאריך התשלום
                    let sapakNextPayDay = new Date(row[0].sapakNextPayDay)
                    if(sapakNextPayDay < new Date(Date.now())){
                        resolve({status:'Need Pay' , data:{packageType:row[0].packageType}})
                        return
                    }
                // }
                if(!row[0].sapakMezahe){
                    resolve({status:'not complete registration' , data:{userPhone:row[0].userPhone,packageType:row[0].packageType}})
                    return
                }else{
                    resolve({status:'registration' , data:{packageType:row[0].packageType}})
                    return
                }
               
            }else{
                resolve({status:'Need Pay', data:{packageType:row[0].packageType}})
                return
            }
        })
    })
}




const editSapak = async function(IDsapak,addsapak){
    return new Promise(async (resolve, reject) => {
        console.log("IDsapak,addsapak")
        console.log(IDsapak,addsapak)
        Pool.query('UPDATE `sapakim` SET `sapakName`=(?),`sapakMezahe`=(?),`sapakLogo`=(?),`sapakOwnerName`=(?),`sapakPhone`=(?),`sapakEmail`=(?),`sapakFax`=(?),`sapakFacebook`=(?),`sapakYouTube`=(?),`sapakInstegram`=(?), `sugMezahe`=(?) WHERE IDsapak = (?)',[addsapak.sapakName,addsapak.sapakMezahe,addsapak.sapakLogo,addsapak.sapakOwnerName,addsapak.sapakPhone,addsapak.sapakEmail,addsapak.sapakFax,addsapak.sapakFacebook,addsapak.sapakYouTube,addsapak.sapakInstegram,addsapak.sugMezahe,IDsapak], (err, row ,fields) => {
            if(err){console.log(err)};
            // console.log(row);
            if (row.affectedRows > 0){
                resolve({status : "success"})
            }else{
                resolve({status : "err"})
            }
        })
    })
}

const getSpakNextPayDay = function(payment){
    let month = 0
    switch (payment.sapakNextPayDay) {
        case 'periodic-1':
            // מצב של חבילה עם חלוקה לפי אחוזים
            month = 1
            break;
        case 'periodic-2':
            month = 2
            break;
        case 'periodic-3':
            month = 3
            break;
        case 'periodic-6':
            month = 6
            break;
        case 'periodic-12':
            month = 11
            break;
        case 'percentages-6':
            month = 3
            break;
        case 'percentages-7':
            month = 24
            break;
        case 'percentages-10':
            month = 24
            break;
        default:
            month = 1
            break;
    }

    payment.sapakNextPayDay = month 
    var CurrentDate = new Date()
    CurrentDate.setMonth(CurrentDate.getMonth() + month);
    payment.sapakNextPayDay = CurrentDate

    return payment
}

const addSapakToDB = async function(payment){
    console.log(payment);
    return new Promise(async (resolve, reject) => {

        payment.packageType = payment.sapakNextPayDay

        payment = getSpakNextPayDay(payment)
        
        Pool.query('INSERT INTO sapakim (sapakCCnumber,sapakCCexpiration,sapakCCcvv,sapakCCidnumber,sapakNextPayDay,packageType) VALUES ((?),(?),(?),(?),(?),(?));',[payment.sapakCCnumber , payment.sapakCCexpiration , payment.sapakCCcvv , payment.sapakCCidnumber , payment.sapakNextPayDay, payment.packageType],async (err, row ,fields) => {
            if (err) return reject(err);
            if (row.affectedRows > 0){
                resolve({status : "success", IDsapak : row.insertId})
            }else{
                resolve({status : "err"})
            }

        })
    })
}


const savePaymentToLog = async function(IDsapak,payment,tranzilaData,ipAddress){
    return new Promise(async (resolve, reject) => {
        
        let paymentDate = new Date(Date.now())
        let paymentAmount = tranzilaData.sum
        let paymentCurrency = 'ils'
        // שם המסוף בטרנזילה בו בוצע החיוב branchCCterminal
        let paymentReference1 = tranzilaData.tz_parent
         // מספר אסמכתא של התשלום, מספר טרנזאקציה בטרנזילה
        let paymentReference2 = tranzilaData.ConfirmationCode
        
        let ccNumber = payment.sapakCCnumber 
        let ccExpiration = payment.sapakCCexpiration
        let ccIDnumber = payment.sapakCCidnumber
        let ccCVV = payment.sapakCCcvv

        let sql = "INSERT INTO `sapakimPayments`(`IDsapak`, `paymentDate`, `paymentAmount`, `paymentCurrency`, `paymentReference1`, `paymentReference2`, `ipAddress`, `ccNumber`, `ccExpiration`, `ccIDnumber`, `ccCVV`) VALUES ((?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?))"
        Pool.query(sql,[IDsapak,paymentDate,paymentAmount,paymentCurrency,paymentReference1,paymentReference2,ipAddress,ccNumber,ccExpiration,ccIDnumber,ccCVV],async (err, row ,fields) => {
            if (err){
                console.log(err);
                return reject(err);
            } 
            if (row.affectedRows > 0){
                resolve({status : "success"})
            }else{
                resolve({status : "err"})
            }

        })


    })
}



const sapakMakePayment = async function(payment){
    return new Promise(async(resolve, reject) => {

        let paymentAmount = 0
        switch (payment.sapakNextPayDay) {
            case 'periodic-1':
                // מצב של חבילה עם חלוקה לפי אחוזים
                paymentAmount = 100
                break;
            case 'periodic-2':
                paymentAmount = 180
                break;
            case 'periodic-3':
                paymentAmount = 240
                break;
            case 'periodic-6':
                paymentAmount = 420
                break;
            case 'periodic-12':
                paymentAmount = 780
                break;
            case 'percentages-6':
                paymentAmount = 300
                break;
            case 'percentages-7':
                paymentAmount = 1
                break;
            case 'percentages-10':
                paymentAmount = 1
                break;
            default:
                paymentAmount = 0
                break;
        }

        //+ NDS 17%
        paymentAmount = paymentAmount*1.17;

        if(paymentAmount <= 0){
            resolve({status:"err"})
        }

        let ChargeMode = 'direct'
        if(payment.packageType == 'percentages'){
            ChargeMode = 'J5'
        }

        option = {
            ccIDnumber:payment.sapakCCidnumber,
            ccNumber:payment.sapakCCnumber,
            ccExpiration:payment.sapakCCexpiration,
            ccCVV:payment.sapakCCcvv,
            totalAmountToCharge:paymentAmount,
            iskaCurrencyTranz:'1',
            ChargeMode:ChargeMode,//type = or direct or J5 or ChargeJ5 or direct
            iskaMaxPayments:'1',
            lang:'he',
            branchCCterminalType:'tranzila',
            branchCCterminal:process.env.MainTerminal,
            branchCCterminalPwd:process.env.TranzilaPW,
        }
              
        
        // חיוב שמגיע למנהלי המערכת, טרמינל שמוגדר במשתני הסביבה
        let getPayRes = await GlobalFunction.getPaytranzila(option)
        if(getPayRes.status == 'success'){
            resolve({status:"success" , tranzilaData:getPayRes.data})
        }else{
            resolve({status:"err" , tranzilaData:getPayRes.data})
        }
    })
}

const encryptPayment = function(payment){
    payment.sapakCCnumber = cryptr.encrypt(payment.sapakCCnumber);
    payment.sapakCCexpiration = cryptr.encrypt(payment.sapakCCexpiration);
    payment.sapakCCcvv = cryptr.encrypt(payment.sapakCCcvv);
    payment.sapakCCidnumber = cryptr.encrypt(payment.sapakCCidnumber);
    return payment
}



const payAndCreateSapak = async function(userPhone,userName,payment,ipAddress,shouldPay){
    return new Promise(async(resolve, reject) => {
            console.log("debbug132131");
            console.log("userPhone,userName,payment,ipAddress,shouldPay",userPhone,userName,payment,ipAddress,shouldPay);

        // // *************************
        // // שליחת תשלום לטרנזילה
        let tranzilaRes = null;
        if(payment.sapakCCnumber=='9999111188882222'){
            tranzilaRes = {
                status:'success',
                tranzilaData:{
                     sum:0,
                    // שם המסוף בטרנזילה בו בוצע החיוב branchCCterminal
                    tz_parent:'dummy credit card',
                     // מספר אסמכתא של התשלום, מספר טרנזאקציה בטרנזילה
                    ConfirmationCode:'00000000'
                }
            };
            //7.884e+9 is 3 months in millinseconds
            // add 3 months to now and set it to next pay date of the sapak.
            payment.sapakNextPayDay = new Date(Date.now()+7.884e9);
        }else{
            tranzilaRes = await sapakMakePayment(payment)
        }
        


        if(tranzilaRes.status == 'err' && shouldPay){
            resolve({status : 'err' , details : 'card err'})
            return
        }
        // // *************************

        payment = encryptPayment(payment)
 
        let addSapakToDBRes = await addSapakToDB(payment)
        
        if(addSapakToDBRes.status == 'err' && shouldPay ){
            resolve({status : 'err' , details : 2525})
        }
        let IDsapak = addSapakToDBRes.IDsapak
  
        savePaymentToLog(IDsapak,payment,tranzilaRes.tranzilaData,ipAddress)

        let addAdminUsersToDBRes = await adminUsersHelper.addAdminUsersToDB(IDsapak , userPhone , userName)
        if(addAdminUsersToDBRes.status == 'success' || !shouldPay){
            let data = {
                IDsapak:addSapakToDBRes.IDsapak,
                userPhone:userPhone,
                userPermission : 'sapak-full'
            }
            let Token = await globalFunction.grantToken(data)
            resolve({status : "success" , Token : Token})
        }
    
    

    })
}

const UpdateSapakPayment = async function(IDsapak,payment,ipAddress, shouldPay){
    return new Promise(async(resolve, reject) => {
        let tranzilaRes= null;
        const DUMMY_CREDIT_CARD = '9999111188882222'
        if (payment.sapakCCnumber == DUMMY_CREDIT_CARD) {
            tranzilaRes = {
                status: 'success',
                tranzilaData: {
                    sum: 0,
                    // שם המסוף בטרנזילה בו בוצע החיוב branchCCterminal
                    tz_parent: 'dummy credit card',
                    // מספר אסמכתא של התשלום, מספר טרנזאקציה בטרנזילה
                    ConfirmationCode: '00000000'
                }
            };
        } else {
            tranzilaRes = await sapakMakePayment(payment)
        }
        if(tranzilaRes.status == 'err' && shouldPay){
            resolve({status : 'err' , details : 'card err'})
            return
        }

        let packageType = payment.sapakNextPayDay;
        console.log('UpdateSapakPayment_1sdfsb');
        console.log(payment);
        // // *************************
        payment = encryptPayment(payment)
        
        savePaymentToLog(IDsapak,payment,tranzilaRes.tranzilaData,ipAddress)
        if(payment.sapakCCnumber == DUMMY_CREDIT_CARD){
            
            payment = getSpakNextPayDay(payment)
        }else{
            //7.884e+9 is 3 months in millinseconds
            // add 3 months to now and set it to next pay date of the sapak.
            payment.sapakNextPayDay = new Date(Date.now()+7.884e9);
        }

        let sql = "UPDATE sapakim SET sapakCCnumber = (?), sapakCCexpiration = (?), sapakCCcvv = (?), sapakCCidnumber = (?), sapakNextPayDay = (?), packageType = (?) WHERE IDsapak = (?);"
                
        Pool.query(sql,[payment.sapakCCnumber , payment.sapakCCexpiration , payment.sapakCCcvv , payment.sapakCCidnumber , payment.sapakNextPayDay,packageType, IDsapak],async (err, row ,fields) => {
            if (err){
                console.log(err);
                return reject(err);
            } 
            console.log(row);
            if (row.affectedRows > 0){
                resolve({status : "sapak Renewal payment"})
            }else{
                resolve({status : "err"})
            }

        })
        

    })
}

const getAllSapakimList = async function(){
    return new Promise(async (resolve, reject) => {
        Pool.query('SELECT sapakim.IDsapak, sapakim.sapakName,sapakim.sapakMezahe,sapakim.sapakLogo,sapakim.sapakOwnerName,sapakim.sapakPhone,sapakim.sapakEmail,sapakim.sapakFax,sapakim.sapakFacebook,sapakim.sapakYouTube,sapakim.sapakInstegram,sapakim.packageType,adminUsers.userName,adminUsers.userPhone,sapakBranches.IDbranch FROM sapakim LEFT JOIN adminUsers ON adminUsers.IDsapak=sapakim.IDsapak LEFT JOIN sapakBranches ON sapakBranches.IDsapak=sapakim.IDsapak WHERE sapakim.sapakName IS NOT NULL AND (userPermission = "sapak-full") ORDER BY sapakim.sapakName;', (err, row ,fields) => {
            if (row.length > 0){
                resolve({status : "success", data : row})
            }else{
                resolve({status : "err"})
            }
        })
    })
}

const logisAs = async function(IDsapak,loginAsIDsapak){
    console.log(IDsapak,loginAsIDsapak);
    return new Promise(async (resolve, reject) => {
     
        Pool.query('SELECT adminUsers.IDuser,adminUsers.IDsapak,adminUsers.userPermission FROM adminUsers WHERE adminUsers.IDsapak = (?) ORDER BY adminUsers.IDuser LIMIT 1;',[loginAsIDsapak],async (err, row ,fields) => {
            console.log(row);

            if (row.length > 0){
            let data = {
                IDsapak:row[0].IDsapak,
                userPermission : row[0].userPermission
            }
            let Token = await globalFunction.grantToken(data)
            resolve({status : "success" , Token : Token})

            }else{
                resolve({status : "err"})
            }
        })
    })
}


module.exports ={
 addSapakToDB , checkAddSapakStep , getSapakDetails , editSapak , getSapakStatus , payAndCreateSapak , UpdateSapakPayment , getAllSapakimList , logisAs
}