
const axios = require('axios');
var jwt = require('jsonwebtoken');
var _ = require('lodash');
var Pool = require('./../../core/db/dbPool')
const format = require('date-fns/format')
var addMinutes = require('date-fns/addMinutes')


// const sendSMS = async function(userPhone){
//     return new Promise((resolve, reject) => {
//         Pool.query('SELECT userPhone FROM adminUsers WHERE userPhone = (?);',[userPhone], (err, row ,fields) => {
          
//         })
//     })
// }

Array.prototype.forEachAsync = async function (fn) {
    for (let t of this) { await fn(t) }
}

Array.prototype.forEachAsyncParallel = async function (fn) {
    await Promise.all(this.map(fn));
}

//let something = await getFields(Table_Name,Field_Out,Compare) -- דוגמה
const getFields = async function(Table_Name,Field_Out,Compare){
    return new Promise((resolve, reject) => {
        // console.log('getFields == ' ,  'SELECT '+ Field_Out +' FROM '+ Table_Name + ' ' + Compare);
        Pool.query('SELECT '+ Field_Out +' FROM '+ Table_Name + ' ' + Compare, (err, row ,fields) => {
            // console.log(err);
            if (err){
                console.log(err);
                return reject(err);
            }
            if (row.length > 0){
                resolve(row);
            }else{
                resolve('notFound'); 
            }
        });
    });
  }

  const getHallsMatrixGlobal = async function(IDiska , IDinlay , IDhall){  
    //   console.log('IDiska234235',IDiska);
    return new Promise(async(resolve, reject) => {
        let IDinlayQuery = ""
        let IDhallQuery = ""

        if(IDinlay){
          IDinlayQuery = "AND chairs.IDinlay = '"+IDinlay+"'"
        }
        if(IDhall){
            IDhallQuery = "OR halls.IDhall = '"+IDhall+"'"
        }

        let sql = "SELECT halls.IDhall , halls.hallName , hallsMatrix.IDchair, hallsMatrix.chairName , hallsMatrix.widthLocation, hallsMatrix.lengthLocation , hallsMatrix.IDchairStatus , chairStatusList.chairStatusName , chairs.Idx  FROM halls LEFT JOIN hallsMatrix on (halls.IDhall = hallsMatrix.IDhall) LEFT JOIN chairs on (hallsMatrix.IDchair = chairs.IDchair "+IDinlayQuery+") LEFT JOIN chairStatusList on (chairStatusList.IDchairStatus = hallsMatrix.IDchairStatus AND chairStatusList.chairStatusLang = 'he') WHERE halls.IDIskaot like '%?%' "+IDhallQuery+" order by hallsMatrix.lengthLocation , hallsMatrix.widthLocation"

        Pool.query(sql,[IDiska], (err, row, fields) => {
            if(err){
                console.log(err);
                reject(err)
            }

            if(row.length == 0){
           
                resolve({status:'success' , data:'Without_seating'})
                return
            }

            // let SeatCounter = 1
// כל מה שמושב
            row.forEach(element => {
                
              
                
                switch (element.IDchairStatus) {
                    case 10:
                        element.bg_color = '#ffffff'
                        break;
                    case 20:
                        element.bg_color = '#c27efc'
                        if(element.Idx){
                            element.bg_color = '#8354ab'
                            element.IDchairStatus = 40
                        }
                        element.Tooltip = element.chairStatusName
                        if(element.IDchairStatus == 40){
                            element.Tooltip = 'מושב מוזמן'
                        }
                        // element.SeatCounter = SeatCounter++
                        break;
                    case 30:
                        element.bg_color = '#7ba9fd'
                        if(element.Idx){
                            element.bg_color = '#5473ab'
                            element.IDchairStatus = 50
                        }
                        element.Tooltip = element.chairStatusName
                        if(element.IDchairStatus == 50){
                            element.Tooltip = 'מושב נכים מוזמן'
                        }
                        // element.SeatCounter = SeatCounter++
                        break;
                    case 40:
                        element.bg_color = '#8354ab'
                        element.Tooltip = element.chairStatusName
                        // element.SeatCounter = SeatCounter++
                        break;
                    case 50:
                        element.bg_color = '#5473ab'
                        element.Tooltip = element.chairStatusName
                        // element.SeatCounter = SeatCounter++
                        break;
                    case 60:
                        element.bg_color = '#fa4f4f'
                        element.Tooltip = element.chairStatusName
                        // element.SeatCounter = SeatCounter++
                        break;
                    case 70:
                        element.bg_color = '#fac07d'
                        element.Tooltip = element.chairStatusName
                        break;
                    case 80:
                        element.bg_color = '#e1e1e1'
                        element.Tooltip = element.chairStatusName

                        break;
                    case 90:
                        element.bg_color = '#c5c5c5'
                        element.Tooltip = element.chairStatusName

                        break;
                
                    default:
                        break;
                }
                
            });

            HallsMatrixByRow = _.groupBy(row, function(ele){
                return ele.lengthLocation
            }); 


            resolve({status:'success' , data:HallsMatrixByRow , hallName:row[0].hallName})
            
        })

    })
}


const SendVerificationCode = async function(userName , userPhone){
    return new Promise((resolve, reject) => {

        var now = new Date();
        now.setHours(now.getHours() + 4 , 10)
        let mobileNumber = userPhone.toString()
        let mobileCode = parseInt(Math.floor(100000 + Math.random() * 900000));
        // console.log('SendVerificationCode -> mobileCode ',mobileCode );
        //let codeExpires = new Date(now).toISOString().slice(0, 19).replace('T', ' ');
        let cusFirstNameToUpdate = userName
        Pool.query('DELETE FROM SMScodes WHERE mobileNumber = (?);',[mobileNumber],async (err, row ,fields) => {
            Pool.query('INSERT INTO SMScodes (mobileNumber, mobileCode, codeExpires, cusFirstNameToUpdate) VALUES ((?),(?),NOW()+INTERVAL 10 MINUTE,(?));',[mobileNumber, mobileCode, cusFirstNameToUpdate],async (err, row ,fields) => {
                if (err) return reject(err);
                if(row.affectedRows > 0){
                    let msg = '[mobileCode]'
                    rs =  await getFields('systemMessages','msgContent',"WHERE IDmsg=1030 AND msgLang='he'")
                    // console.log("SendVerificationCode -> rs", rs);
                    if (rs!='notFound') { msg = rs[0].msgContent }
                    // console.log("SendVerificationCode -> msg, mobileCode, rs[0].msgContent", msg, mobileCode, rs[0].msgContent);
                    msg = msg.replace('[mobileCode]', mobileCode)
                    //let msg = "שלום "+userName+" הקוד הזמני שלך להתחברות הוא " + mobileCode
                    // await לתקן
                    await sendSMS(mobileNumber , msg)
                    resolve(true)
                }
                resolve(false)
            })
        });
    })
}


const grantToken  = async function(data){
    return new Promise((resolve, reject) => {

        jwt.sign(data, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN } , function(err, Token) {
            if (err) reject(err)
            resolve(Token)
        })
    })
}

const checkToken  = async function(Token){
    return new Promise((resolve, reject) => {
        if(!Token){
            resolve(null)
        }
        Token = Token.split(" ");
        if(!Token[1]){
            resolve(null)
        }
        Token = Token[1]
        jwt.verify(Token, process.env.JWT_SECRET, function(err, decoded) {
            if (err) {
                resolve(null)
            }
            let res = {
               IDsapak : decoded.IDsapak,
               userPhone : decoded.userPhone,
               IDcustomer : decoded.IDcustomer,
            }
            resolve(res)
        });
    })
}


const getFeatureOptionCost = async function(IDfo, IDiska){

    gfoc = 0
    let rs =  await getFields("featureOptionsPerIska","foPrice, isPrecentage","WHERE IDiska="+IDiska+" AND IDfo='"+IDfo+"' LIMIT 1")
    if (rs!='notFound') { 
        if (rs[0].isPrecentage==1) {
            // מחשב סכום הנחה באחוזים מעלות כרטיס\מוצר
            gfoc = rs[0].foPrice
            rs =  await getFields('iskaot','basicIskaPrice','WHERE IDiska='+IDiska+' LIMIT 1')
            // ***FIX-ME*** לא מחוייב - בשורה הבאה מחושב עפ מחיר בסיסי של העסקה, יש להעביר את המחיר הזה באקולייזר כדי לקבל מחיר נכון ***FIX-ME***
            if (rs!='notFound') { gfoc = (rs[0].basicIskaPrice * gfoc / 100).toFixed(2) }
        } else {
            gfoc = rs[0].foPrice 
        }
    } else {
        gfoc = 0
    }
    console.log('getFeatureOptionCost(IDfo='+IDfo+', IDiska='+IDiska+') = '+gfoc)
    
    return gfoc
}

async function getInlayMaxAvailableTickets(IDinlay) {
    // --- בודקת כמה מקסימום כרטיסים לסבב וכמה כרטיסים כבר הוזמנו לסבב הספציפי, מחזירה כמה כרטיסים פנויים נשארו בסבב הנבדק ---
    return new Promise(async (resolve, reject) => {
        console.log("query948573948","SELECT isk.maximumTicketsPerRound FROM iskaot as isk LEFT JOIN inlays as inl ON (isk.IDiska=inl.IDiska) WHERE inl.IDinlay='"+IDinlay+"'");
        Pool.query("SELECT isk.maximumTicketsPerRound FROM iskaot as isk LEFT JOIN inlays as inl ON (isk.IDiska=inl.IDiska) WHERE inl.IDinlay='"+IDinlay+"'", async (err, rs ,fields) => {
            //console.log(err, rs)
            let maximumTicketsPerRound = 10     // -- some default value --
            if (rs.length>0) { maximumTicketsPerRound = parseInt(rs[0].maximumTicketsPerRound) }

            let InlayTotalTickets = 0
            rs = await getFields('orders','orderTicketsTotal',"WHERE IDinlay='"+IDinlay+"' AND orderStatus<>20 AND orderStatus<>30  AND orderStatus<>60")
            if (rs!='notFound') { 
                rs.forEach(element => {
                    if (IsJsonString(element.orderTicketsTotal)) {
                        oua = JSON.parse(element.orderTicketsTotal)
                        for (tmpii=0; tmpii<oua.length; tmpii++) { InlayTotalTickets = InlayTotalTickets + parseInt(oua[tmpii].quantity) }
                    }
                })
            }
            console.log('InlayTotalTickets34gdfg',InlayTotalTickets);
            resolve(parseInt(maximumTicketsPerRound-InlayTotalTickets))
        })
    })
}

const getMinimumForOrder = async function(IDinlay, IDorder){
    // console.log('getMinimumForOrder -> IDinlay' , IDinlay, 'IDrder', IDorder);
    return new Promise(async (resolve, reject) => {
        
        // Pool.query('SELECT minimumTicketsPerOrder,minimumTicketsInFirstOrder FROM iskaot WHERE IDiska = (?)',[IDiska],async (err, row ,fields) => {
        Pool.query("SELECT isk.minimumTicketsPerOrder , isk.minimumTicketsInFirstOrder , isk.IDiska FROM iskaot as isk LEFT JOIN inlays as inl ON (isk.IDiska=inl.IDiska) WHERE inl.IDinlay=(?)",[IDinlay],async (err, row ,fields) => {
            if (err) {
                console.log(err);
                return reject(err);
            }
            if(row.length > 0){
                let IDiska = row[0].IDiska
                    if(row[0].minimumTicketsPerOrder > 0){
                        // console.log("getMinimumForOrder ->", row[0].minimumTicketsPerOrder)
                        resolve(row[0].minimumTicketsPerOrder)
                        return
                    }else{
                        SQLquery = "SELECT idx FROM orders WHERE IDiska='" + IDiska + "' AND IDinlay='" + IDinlay + "'"
                        if (!isNaN(IDorder) && IDorder!='' && IDorder!=null) { SQLquery += " AND IDorder<>'" + IDorder + "'"}
                        Pool.query(SQLquery,(err, ordersRow ,fields) => {
                            if (err) {
                                console.log(err);
                                return reject(err);
                            }
                            // לבדוק עם אהוד אם התיקון הזה טוב
                            // if(ordersRow.length > 0){
                            if(ordersRow.length > 1){
                                // console.log("getMinimumForOrder ->", 1)
                                resolve(1)
                                return
                            }else{
                                // console.log("getMinimumForOrder ->", row[0].minimumTicketsInFirstOrder)
                                resolve(row[0].minimumTicketsInFirstOrder)
                                return
                            }
                        })
                        
                    }
                    
                    return
                }else{
                    console.log("getMinimumForOrder ->", 0)
                    resolve(0)
                    console.log('לא נמצאה רשומה');
                    // resolve({status : "success" , Verification : false})
                }
         
        })
    })
}

const getChairsSelectedByIdiskaAndIDinlay = async function(IDorder,IDiska,IDinlay){  
    return new Promise(async(resolve, reject) => {
        Pool.query("select hallsMatrix.chairName FROM chairs LEFT JOIN hallsMatrix on(chairs.IDchair = hallsMatrix.IDchair) WHERE chairs.IDorder = (?) AND chairs.IDiska = (?) AND chairs.IDinlay = (?)",[IDorder,IDiska,IDinlay], (err, row, fields) => { 
            if(err){
                console.log(err);
                reject(err)
            }
            resolve({status : 'success' , data:row})
        })
    })
}



const getAllCity = async function(lang){
    return new Promise((resolve, reject) => {
        console.log(lang);
        if(lang == "he"){
            sql = 'SELECT cityCode,cityName_HE FROM cities'
        }else{
            sql = 'SELECT cityCode,cityName_EN FROM cities'
        }

        Pool.query(sql, (err, row ,fields) => {
            if (err) return reject(err);
            if(row.length > 0){
                if(lang == "he"){
                    _.map(row, function (obj) {
                        obj.id = obj.cityCode;
                        obj.text = obj.cityName_HE;
                        return obj;
                    });
                    }else{
                        _.map(row, function (obj) {
                            obj.id =  obj.cityCode;
                            obj.text =  obj.cityName_EN;
                            return obj;
                        });
                    }
                resolve({status : 'success' , data:row })
            }
                resolve({status : 'err'})
        })
    })
}



const getRandNumber = function(digits , tableName , fieldName , includeChars){   
    return new Promise((resolve, reject) => {
        let randNum
        if(includeChars){
            randNum = Math.random().toString(36).substring(digits);
        }else{
            randNum = Math.floor(Math.random() * 9 * Math.pow(10,digits-1)) + Math.pow(10,digits-1);
        }
        Pool.query('SELECT * FROM '+tableName+' WHERE (?) = (?);',[fieldName , randNum], (err, row ,fields) => {
            if (err) return reject(err);
            if(row.length > 0){
                this.getRandNumber(digits , tableName , fieldName)
            }else{
                resolve(randNum)
            }
        })
    });
}




const sendSMS = async function(Phone , msg){
    // return new Promise((resolve, reject) => {
        console.log(" send sms to " , Phone , 'msg ' , msg);
        // console.log(" process.env.smsID " , process.env.smsID , 'process.env.smsPassword ' , process.env.smsPassword);
        if((Phone == '0508323234' || Phone=='0524022222' || Phone=='0500000000') && process.env.DebugMode){
            console.log(msg);
            return
        }

         axios.post('https://secureapi.soprano.co.il/QuickGateway.ashx?apiprotocol=json',{
         "sms": {
             "account": {
                 "id": process.env.smsID,
                 "password": process.env.smsPassword
             },
             "attributes": {
                 "reference": "1",
                 "replyPath": "captain-c"
             },
             "schedule": {
                 "relative": "0"
             },
             "targets": {
                 "cellphone": [
                 {
                     "@reference": "12",
                     "#text": Phone
                 }
                 ]
             },
             "data": msg
             }
         }).then(function (response) {
             //console.log(response);
             console.log('msg sent!');
         });

        // console.log("post to  http://soprano.co.il/prodsms/corpsms");
      
        // Pool.query('SELECT userPhone FROM adminUsers WHERE userPhone = (?);',[userPhone], (err, row ,fields) => {
          
        // })
    // })
}

function IsJsonString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

const getCCexpirationByFormat = function(CCexpiration,branchCCterminalType){
            // שינוי תאריך לפורמט טרנזילה

    switch (branchCCterminalType) {
        case 'tranzila': 
        case 'gama': 
            CCexpiration = CCexpiration.split('/')
            if(CCexpiration.length == 1){
                return CCexpiration[0]
            }
            if(CCexpiration[0].length == 1){
                CCexpiration[0] = 0 + CCexpiration[0]
            }
            CCexpiration[1] = CCexpiration[1].substring(2)
            CCexpiration = CCexpiration[0] + CCexpiration[1]
            return CCexpiration

        break;
        case 'cardcom':
            console.log('CCexpiration' ,CCexpiration);
            CCexpiration = CCexpiration.split('/')
            return CCexpiration
        break;
        default:
            break;
    }


}


// עסקת אילוץ
// https://secure5.tranzila.com/cgi-bin/tranzila71u.cgi?supplier=captain&myid=20202081&ccno=5326102310000591&expdate=0322&mycvv=799&sum=50&currency=1&tranmode=V&cred_type=8&TranzilaPW=BXXkTDK6&response_return_format=json&npay=6&fpay=8&spay=7

// עסקת חיוב לפי מדריך
// https://secure5.tranzila.com/cgi-bin/tranzila71u.cgi?supplier=captain&tranmode=F&index=201&authnr=0003271&expdate=0322&sum=50&currency=1&cred_type=1&myid=20202081&mycvv=799&TranzilaPW=BXXkTDK6

//לשנות שם פונקציה getPay = tranzilaChargeCC

// await getPay(process.env.MainTerminal, myCart.ccIDnumber, myCart.ccNumber, myCart.ccExpiration, myCart.ccCVV, totalAmountToCharge, iskaCurrencyTranz,'V',myCart.iskaMaxPayments).then(x=>{
// *******
//getPay הפונקציה הזאת תהפוך ל
const getPay = async function(IDbranch , option){
    return new Promise(async(resolve, reject) => {
        let getPayRes
        let terminal = await getFields("sapakBranches" , "branchCCterminalType,branchCCterminal,branchCCterminalPwd, IDSapak","WHERE IDbranch = '" + IDbranch + "'")
        if(terminal != 'notFound'){
            option.branchCCterminalType = terminal[0].branchCCterminalType
            option.branchCCterminal = terminal[0].branchCCterminal
            option.branchCCterminalPwd = terminal[0].branchCCterminalPwd
        }
        else{
            resolve({status:'error', Details:'No found terminal'})
            return
        }
        
        switch (option.branchCCterminalType) {
            case 'tranzila':
                    getPayRes = await getPaytranzila(option)
                break;
            case 'gama':
                let packageType = await getFields("sapakim" , "packageType","WHERE IDSapak = '" + terminal[0].IDSapak + "'")
                console.log('packageType132sdf21', packageType);
                option.percentage = packageType[0].packageType.indexOf("percentages-") !==-1 ? Number(packageType[0].packageType.replace("percentages-","")) : 0;

                getPayRes = await getPayGama(option)
                break;
            case 'cardcom':
                    getPayRes = await getPayCardcom(option)
                break;
            default:
                break;
        }
        resolve(getPayRes)
    });
}



// IDbranch = MainTerminal
// option = {
//     IDnumber:'20202081',
//     Number:'5326102310000591',
//     Expiration:'03/2022',
//     CVV:'799',
//     totalAmountToCharge:'112',
//     iskaCurrencyTranz:'1',
//     ChargeMode:'J5',//type token = or direct or J5 or ChargeJ5 or direct
//     iskaMaxPayments:'1',
//     lang:'he',
// }

// //IDbranch - | 82 = tranzila | 83 = cardcom | 159 = gama
// let IDbranch = 83
// getPay(IDbranch , option)



const getPaytranzila = function(option){
    return new Promise((resolve, reject) => { 

        let cred_type = 1
        let qqq = ''
        option.iskaMaxPayments = parseInt(option.iskaMaxPayments)

        if(option.ccExpiration)
        option.ccExpiration = getCCexpirationByFormat(option.ccExpiration,option.branchCCterminalType)
     

        if(option.iskaMaxPayments && option.iskaMaxPayments > 1){
            cred_type = 8
            spay = parseInt(option.totalAmountToCharge / option.iskaMaxPayments)
            fpay = option.totalAmountToCharge - (spay * (option.iskaMaxPayments - 1))
            fpay = (fpay).toFixed(2)
            npay = option.iskaMaxPayments - 1
            qqq += '&npay='+npay + '&fpay='+fpay + '&spay='+spay
        }else{
            cred_type = 1
        }

        console.log(option);
        console.log(option.totalAmountToCharge,qqq);
        let url = ""
        // Charging a credit card
        if(option.ChargeMode == 'direct'){
            url = 'https://secure5.tranzila.com/cgi-bin/tranzila71u.cgi?supplier='+option.branchCCterminal+'&tranmode=A&ccno='+option.ccNumber+'&expdate='+option.ccExpiration+'&sum='+option.totalAmountToCharge+'&currency='+option.iskaCurrencyTranz+'&cred_type='+cred_type+'&myid='+option.ccIDnumber+'&mycvv='+option.ccCVV 
        }
        //Adding Create a Token only, no charge
        if(option.ChargeMode == 'J5'){
            url = 'https://secure5.tranzila.com/cgi-bin/tranzila71u.cgi?supplier='+option.branchCCterminal+'&tranmode=V&ccno='+option.ccNumber+'&expdate='+option.ccExpiration+'&sum='+option.totalAmountToCharge+'&currency='+option.iskaCurrencyTranz+'&cred_type='+cred_type+'&myid='+option.ccIDnumber+'&mycvv='+option.ccCVV 
        }

        // Charging a Token (change cardnumber to Token) 
        if(option.ChargeMode == 'ChargeJ5'){
            url = 'https://secure5.tranzila.com/cgi-bin/tranzila71u.cgi?supplier='+option.branchCCterminal+'&tranmode=F&ccno='+option.ccNumber+'&expdate='+option.ccExpiration+'&sum='+option.totalAmountToCharge+'&currency='+option.iskaCurrencyTranz+'&cred_type='+cred_type+'&myid='+option.ccIDnumber+'&mycvv='+option.ccCVV+'&authnr='+option.ConfirmationCode+'&index='+option.index+'' 
        }

        url+= qqq + '&TranzilaPW='+ option.branchCCterminalPwd + '&response_return_format=json'
        console.trace("getPaytranzila -> trace")
        console.log("getPaytranzila -> url");
        console.log(url);
        axios.get(url).then(function (response) {
            console.log('make payment and get response tranzila code : ' , response.data.Response);

            if(response.data.Response == '000'){
                resolve({status:"success" , data:response.data})
            }else{
                resolve({status:"err" , data:response.data})
            }
                
        });

    })
}

const getPayGama = function(option){
    return new Promise((resolve, reject) => { 
        if(option.ccExpiration)
        option.ccExpiration = getCCexpirationByFormat(option.ccExpiration,option.branchCCterminalType)
    
        // סכום באגורות
        option.totalAmountToCharge = parseFloat(option.totalAmountToCharge) * 100

        // let url = 'https://gateway20.pelecard.biz/services/AuthorizePaymentsType'
        // let url = 'https://gateway20.pelecard.biz/services/AuthorizePaymentsType'
        //type token = or direct or J5 or ChargeJ5 or direct

        let url = ""

        if(option.ChargeMode == 'J5'){
            if(parseInt(option.iskaMaxPayments) < 3){
                // עסקה רגילה
                url = 'https://gateway20.pelecard.biz/services/AuthorizeCreditCard'
            }
            if(parseInt(option.iskaMaxPayments) >= 3){
                //  עסקת תשלומים
                url = 'https://gateway20.pelecard.biz/services/AuthorizePaymentsType'
            }
        }

        if(option.ChargeMode == 'ChargeJ5'){
            if(parseInt(option.iskaMaxPayments) < 3){
                // עסקה רגילה
                url = 'https://gateway20.pelecard.biz/services/DebitRegularType'
            }
            if(parseInt(option.iskaMaxPayments) >= 3){
                //  עסקת תשלומים
                url = 'https://gateway20.pelecard.biz/services/DebitPaymentsType'
            }
        }

        
        // כאן לשלוף פרטים מהדאטה בייס כמו טוקן לחיוב 
        let body

        if(option.ChargeMode == 'J5'){
            body = {
                "terminalNumber": process.env.gamaTerminal,
                "user": process.env.gamaUsername,
                "password":  process.env.gamaPassword,
                "businessNumber": option.branchCCterminal,
                "creditCard": option.ccNumber,
                "creditCardDateMmYy": option.ccExpiration,
                "token": null,
                'createtoken':true,
                // "ActionType": option.ChargeMode,
                "paymentsNumber":  option.iskaMaxPayments,
                // "firstPayment": option.firstPayment,
                "total": option.totalAmountToCharge,
                "currency": option.iskaCurrencyTranz,
                "CVV": option.ccCVV,
                "id": option.ccIDnumber,
                "paramX": "123123",
                "shopNumber": option.percentage,
            }
            if(parseInt(option.iskaMaxPayments) < 3){
                option.firstPayment = "auto"
            }
        }

        if(option.ChargeMode == 'ChargeJ5'){
            body = {
                "terminalNumber": process.env.gamaTerminal,
                "user": process.env.gamaUsername,
                "password":  process.env.gamaPassword,
                "businessNumber": option.branchCCterminal,
                "total": option.totalAmountToCharge,
                "currency": option.currency,
                "CVV": option.ccCVV,
                "id": option.ccIDnumber,
                "paramX": "test",
                "shopNumber": option.percentage,
                "paymentsNumber" : option.iskaMaxPayments,
                "authorizationNumber" :option.authorizationNumber,
                "token" : option.token
            }
        }

        
        console.log("GlobalFunction -> getPayGama");
        console.log("url",url);
        console.log(body);
        axios.post(url , body ).then(function (response) {

            console.log('make payment and get response Gama code : ' , response.data.StatusCode);
        
            if(response.data.StatusCode == '000'){
                resolve({status:"success" , data:response.data})
            }else{
                resolve({status:"err" , data:response.data})
            }
            
            data = ""
            resolve({status:"err" , data:data})
        })
    })


    // return
    // return new Promise((resolve, reject) => { 
    //     resolve({status:"success" , data:1})
    // })
}

const getPayCardcom = function(option){
    return new Promise((resolve, reject) => { 

        // Charging a credit card: 
        // https://secure.cardcom.solutions/Interface/Direct2.aspx?TerminalNumber=1000&Sum=1&cardnumber=4580000000000000&cardvalidityyear=2025&cardvaliditymonth=12&identitynumber=0458000000&username=barak9611&Languages=he
        // -------------------------------------------  
        // Create a Token only, no charge: (Jparameter=2&CreateToken=true ) 
        // https://secure.cardcom.solutions/Interface/Direct2.aspx?TerminalNumber=1000&Sum=1&cardnumber=4580000000000000&cardvalidityyear=2025&cardvaliditymonth=12&identitynumber=0458000000&username=barak9611&Languages=he&Jparameter=2&CreateToken=true
        // --------------------------------------------
        // Charging a Token (change cardnumber to Token)
        //https://secure.cardcom.solutions/Interface/Direct2.aspx?TerminalNumber=1000&Sum=1&Token=4cf8e168-261e-4613-8d20-000332986b24&cardvalidityyear=2025&cardvaliditymonth=12&identitynumber=0458000000&&username=barak9611&Languages=he&UniqAsmachta=autonumber

        // ccIDnumber: '20202081',
        // ccNumber: '5326102310000591',
        // ccExpiration: '03/2022',
        // ccCVV: '799',
        // totalAmountToCharge: '100',
        // iskaCurrencyTranz: '1',
        // ChargeMode: 'J5',
        // iskaMaxPayments: '1',
        // branchCCterminalType: 'cardcom',
        // branchCCterminal: 'shlomi',
        // branchCCterminalPwd: '123123',
        // Jparameter: '2',
        // CreateToken: true

        let ccExpiration = getCCexpirationByFormat(option.ccExpiration,option.branchCCterminalType)
        
        let url = ""

        // Charging a credit card
        if(option.ChargeMode == 'direct'){
            url = 'https://secure.cardcom.solutions/Interface/Direct2.aspx?TerminalNumber='+option.branchCCterminal+'&Sum='+option.totalAmountToCharge+'&NumOfPayments='+option.iskaMaxPayments+'&cardnumber='+option.ccNumber+'&cardvalidityyear='+ccExpiration[1] +'&cardvaliditymonth='+ccExpiration[0]+'&identitynumber='+option.ccIDnumber+'&username='+option.branchCCterminalPwd+'&Languages='+option.lang+''
        }
        //Adding Create a Token only, no charge
        if(option.ChargeMode == 'J5'){
            url = 'https://secure.cardcom.solutions/Interface/Direct2.aspx?TerminalNumber='+option.branchCCterminal+'&Sum='+option.totalAmountToCharge+'&NumOfPayments='+option.iskaMaxPayments+'&cardnumber='+option.ccNumber+'&cardvalidityyear='+ccExpiration[1] +'&cardvaliditymonth='+ccExpiration[0]+'&identitynumber='+option.ccIDnumber+'&username='+option.branchCCterminalPwd+'&Languages='+option.lang+'&Jparameter=2&CreateToken=true'
        }

        // Charging a Token (change cardnumber to Token) 
        if(option.ChargeMode == 'ChargeJ5'){
            url = 'https://secure.cardcom.solutions/Interface/Direct2.aspx?TerminalNumber='+option.branchCCterminal+'&Sum='+option.totalAmountToCharge+'&Token='+option.ConfirmationCode+'&cardvalidityyear='+ccExpiration[1]+'&cardvaliditymonth='+ccExpiration[0]+'&identitynumber='+option.ccIDnumber+'&&username='+option.branchCCterminalPwd+'&Languages='+option.lang+'&UniqAsmachta=autonumber'
        }
        console.log('cardcom url = ' , url);
        axios.get(url).then(function (response) {
            //*** FIXME ****
            // response.data = undefined
            let data
            if(response.data){
                data = Object.fromEntries(new URLSearchParams(response.data));
            }else{
                resolve({status:"err"})
            }
 
            if(data.ResponseCode == '0'){
                resolve({status:"success" , data:data})
            }else{
                resolve({status:"err" , data:data})
            }
            
        }).catch((err)=>{
            console.log(err);
            resolve({status:"err"})
        })
        
    })
}


// const getPay = function(paymentReference1,ccIDnumber,ccNumber,ccExpiration,ccCVV,paymentAmount,paymentCurrency,tranmode,npay,index,authnr){   
//     return new Promise((resolve, reject) => { 
        

//     })
// }


function formatDate(date) {
    date = new Date(date)
    return date.toISOString();
    // console.log(format(addMinutes(date, -date.getTimezoneOffset()), 'yyyy-MM-dd HH:mm:ss'));
    // return format(addMinutes(date, date.getTimezoneOffset()), 'yyyy-MM-dd HH:mm:ss');
}


/**
 * Router Set And Get function
 */
const getRoute = function(routeCode){   
    // --- מתרגם קוד ניתוב לקישור שלו המלא ---
    console.log(routeCode);
    return new Promise((resolve, reject) => {
        Pool.query("SELECT routeURL FROM router WHERE isActive=1 AND routeCode=(?)",[routeCode],async (err, row ,fields) => {
            if (err) return reject(err);
            if(row.length > 0){
                Pool.query("UPDATE router SET counter = counter +1 WHERE routeCode = (?)",[routeCode],async (err, row ,fields) => {
                    if(err){ console.log(err); }
                })
                resolve({status:'success' , url: row[0].routeURL})
             }else{
                 resolve({status:'err' , details:'err 4198'})
             }
        })
    })
}


const setRoute = function(routeURL){   
    // --- יוצר קוד ניתוב חדש או מחזיר קוד ניתוב קיים עבור קישור כלשהו ---
    // --- מניחים שהקישור תמיד יהיה תקין בלי תווים מיוחדים שיהוו בעיה במסד הנתונים, כי כל הקישורים מגיעים מהקוד של המערכת, לכן אין "אס.קיו.אל-פיקס" על הקישור שמגיע לפונקציה ---
    return new Promise((resolve, reject) => {
        let routeCode = ""
        Pool.query("SELECT routeCode FROM router WHERE isActive=1 AND routeURL=(?)",[routeURL],async (err, row ,fields) => {
            if (err) return reject(err);
            if(row.length == 0){
                //  --- קישור חדש לא קיים בראוטר ---
                routeCode = await getRandNumber(6 , "router" , "routeCode" , true)
                let Datenow =  format(new Date(Date.now()), "yyyy-MM-dd hh:mm:ss")   
                Pool.query("INSERT INTO router (creationDate, routeURL, routeCode, counter, isActive) VALUES ((?),(?),(?),(0),(1))",[Datenow,routeURL,routeCode],async (err, routerow ,fields) => {
                    if(err){
                        reject(err)
                        console.log(err);
                    }
                    if(routerow.affectedRows > 0){
                        resolve({status:'success' , url: process.env.pBaseURL +'/r/'+routeCode})
                    }else{
                        resolve({status:'err' , details:'err 4198'})
                    }
                })
            }else{
                //  --- קישור קיים ופעיל בראוטר ---
                resolve({status:'success' , url: process.env.pBaseURL +'/r/'+row[0].routeCode})
            }
        })
    })
}

module.exports ={
    sendSMS,SendVerificationCode,grantToken,getAllCity,getRandNumber,IsJsonString,setRoute,getRoute, getFields , getPay , checkToken , formatDate, getPaytranzila , getCCexpirationByFormat, getFeatureOptionCost, getMinimumForOrder, getInlayMaxAvailableTickets, getHallsMatrixGlobal, getChairsSelectedByIdiskaAndIDinlay
}