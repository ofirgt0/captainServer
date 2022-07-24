// פקודת הרצה לסקריפט
// window development
// set NODE_ENV=development&& node t4m_close_auction
// linux prod
// export NODE_ENV=prod&& node t4m_close_auction
const _ = require('underscore');
const Cryptr = require('cryptr');


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

const Pool = require('./../core/db/dbPool')
const GlobalFunction = require('./../helpers/admin/GlobalFunction')
const cryptr = new Cryptr(process.env.cryptr_SECRET);

const getAllCloseAuction = async function(){  
    return new Promise((resolve, reject) => {
        let sql = `
        SELECT 
        isk.iskaName,ord.IDorder,ord.IDiska,ord.orderBidPrice,ord.IDcustomer,
        isk.minimumBidders,cus.customerFirstName,cus.customerLastName,cus.customerPhoneNumber,
        pay.IDpayment,pay.paymentAmount,pay.paymentReference1,pay.ccNumber,pay.ccExpiration,pay.ccIDnumber,pay.ccCVV,pay.paymentCurrency
        FROM orders as ord 
        RIGHT JOIN iskaot as isk on(ord.IDIska = isk.IDiska) 
        RIGHT JOIN customers as cus on(ord.IDcustomer = cus.IDcustomer) 
        RIGHT JOIN payments as pay on(ord.IDorder = pay.IDorder) 
        WHERE isk.auctionExpiration <= NOW() AND isk.iskaType = 'auction' AND ord.orderStatus = '40' AND (paymentStatus=0 OR paymentStatus=1) order by orderDate ASC
        `
        Pool.query(sql, (err, row ,fields) => {
            if (err){
                console.log(err);
                return reject(err);
            }
            resolve(row)
        })
    })
}

const updateAllToStatus50 = async function(allIDorder){
    return new Promise(async (resolve, reject) => {
        let sql = "UPDATE orders SET orderStatus = '50' where IDorder IN ("+allIDorder+")"
        console.log(sql);
        Pool.query(sql, (err, row ,fields) => {
            if (err){
                console.log(err);
                return reject(err);
            }
            resolve()
        })
    })

}

const findWinner = async function(allBid){
    Winner = _.max(allBid, function(Bid){return Bid.orderBidPrice;})
    return Winner
}



const GetPaid = async function(allBid,IDorder){
    return new Promise(async (resolve, reject) => {

        await allBid.forEachAsync(async(element) => {
            IDpayment           = element.IDpayment
            paymentAmount       = parseFloat(element.paymentAmount) 
            paymentReference1   = element.paymentReference1
            ccNumber            = cryptr.decrypt(element.ccNumber)
            ccExpiration        = cryptr.decrypt(element.ccExpiration)
            ccIDnumber          = cryptr.decrypt(element.ccIDnumber)
            ccCVV               = cryptr.decrypt(element.ccCVV)
            paymentCurrency     = element.paymentCurrency
            // --- התאמת משתנה המטבע לחיוב במערכת טרנזילה ---
            switch(paymentCurrency) {
                case 'ils': paymentCurrency = '1'; break;
                case 'usd': paymentCurrency = '2'; break;
                case 'eur': paymentCurrency = '7'; break;
                default:    paymentCurrency = '1';
            }
            // ***FIX-ME***  פה צריך להיות פוסט אל טרנזילה לחיוב של כל תשלום מהטבלה בנפרד ***FIX-ME***
            // --- שים לב! החיוב לביצוע הוא יישום של חיוב J5 שבוצע ואושר קודם לכן, לא לחייב שוב את הכרטיס בחיוב נוסף!! ---
            /*      ##############################################################
            ##                                                          ##
            ##    TRANZILA API HERE                                     ##
            ##    POST ALL PARAMETERS TO CHARGE EXIST J5 TRANSACTION    ##
            ##                                                          ##
            ##############################################################    */
            // --- לאחר החיוב חוזר פרמטר ccReply=000 אם החיוב עבר בהצלחה ---
            // ccReply = '000'     // ***FIX-ME*** כרגע מוזן פה קשיח להסיר אחכ ***FIX-ME***
            
            
            // עסקת אילוץ עם J5
            // https://secure5.tranzila.com/cgi-bin/tranzila71u.cgi?supplier=captain&tranmode=F&index=179&sum=50&cy=1&cred_type=1&expdate=0424&TranzilaPW=BXXkTDK6
            
            paymentReference1 = JSON.parse(element.paymentReference1)
            

            option = {
                ccIDnumber: ccIDnumber,
                ccNumber: ccNumber,
                ccExpiration:'',//נקבע למטה
                ccCVV:ccCVV,
                totalAmountToCharge:paymentAmount,
                iskaCurrencyTranz:paymentCurrency,
                ChargeMode:'ChargeJ5',//type token = or direct or J5 or ChargeJ5 or direct
                lang:'he',
                index:paymentReference1.index,
                ConfirmationCode:paymentReference1.ConfirmationCode
            }


            let IDbranch = await GlobalFunction.getFields('orders' , 'IDbranch' , "WHERE IDorder ='"+ IDorder +"'")
            console.log(IDbranch);
            if(IDbranch != 'notFound'){
                IDbranch = IDbranch[0].IDbranch
            }
            let branchCCterminalType = await GlobalFunction.getFields('sapakBranches' , 'branchCCterminalType' , "WHERE IDbranch ='"+ IDbranch +"'")
            if(branchCCterminalType != 'notFound'){
                branchCCterminalType = branchCCterminalType[0].branchCCterminalType
            }

            if(branchCCterminalType == 'tranzila'){
                option.index = paymentReference1.index
                option.ConfirmationCode = paymentReference1.ConfirmationCode
                option.ccExpiration = paymentReference1.expdate
            }

            if(branchCCterminalType == 'cardcom'){
                option.index = paymentReference1.ApprovalNumber
                option.ConfirmationCode = paymentReference1.Token
                option.ccExpiration = ccExpiration
            }

            if(branchCCterminalType == 'gama'){
                option.iskaMaxPayments = paymentReference1.ResultData.TotalPayments
                option.authorizationNumber = paymentReference1.ResultData.DebitApproveNumber
                option.token =  paymentReference1.ResultData.Token
                option.currency =  paymentReference1.ResultData.DebitCurrency
            }

            let tarzres = await GlobalFunction.getPay(IDbranch , option)       


            // let tarzres = await GlobalFunction.getPay(paymentReference1.supplier,'','',paymentReference1.expdate,'',paymentReference1.sum,paymentCurrency,'F','',paymentReference1.index,paymentReference1.ConfirmationCode)
            
            
            newPaymentStatus = 1
            if (tarzres.status != 'success') { newPaymentStatus = 2; allPaymentsInStatus1 = false }
            // --- מעדכן סטטוס תשלום בהתאם, עבר או נכשל ---                       
            Pool.query('UPDATE payments SET paymentStatus='+newPaymentStatus+' WHERE IDpayment='+IDpayment, async (err, rs2 ,fields) => {
                //console.log(rs2, err)
                if (rs2.affectedRows>0) { console.log('updated payment status to '+newPaymentStatus) }
                else { console.log('*FAILED* to update payment status') }
            })
            newOrderStatus = 50     // שולמה במלואה
            if (newPaymentStatus==2) { newOrderStatus = 10 }    // חיוב נכשל
            Pool.query('UPDATE orders SET orderStatus='+newOrderStatus+' WHERE IDorder='+element.IDorder+' AND IDpayment='+element.IDpayment, async (err, rs ,fields) => {
                //console.log(rs, err)
                if (rs.affectedRows>0) { console.log('updated (sub)order status') }
                else { console.log('*FAILED* to update (sub)order status') }
            })
            resolve()
        })



    })
    
}



const Main = async function(){

    let CloseAuction = await getAllCloseAuction()
    if(CloseAuction.length == 0){
        console.log('did not find any Auction to close');
    }

    CloseAuction = _.groupBy(CloseAuction, function(ele){  return ele.IDiska   });

    let i = 0
    let IDmsg = 0
    await Object.keys(CloseAuction).forEachAsync(async(IDiska)=>{
        iskaName = CloseAuction[IDiska][i].iskaName
        NumberOfParticipants = CloseAuction[IDiska].length
        minimumBidders = CloseAuction[IDiska][i].minimumBidders
        // console.log('iskaName = ' , iskaName , 'NumberOfParticipants = ' , NumberOfParticipants , 'minimumBidders = ' , minimumBidders);
        
        adminPhone = await GlobalFunction.getFields('iskaot RIGHT JOIN adminUsers on (adminUsers.IDsapak = iskaot.IDsapak)' , 'adminUsers.userPhone' , "WHERE iskaot.IDiska = '"+IDiska+"' limit 1")
        if(adminPhone != 'noFound'){
            adminPhone = adminPhone[0].userPhone
        }        
        // FIXME להחזיר לזה בסוף
        if(NumberOfParticipants >= minimumBidders){
            // יש מספיק משתתפים למכרז
            let Winner = await findWinner(CloseAuction[IDiska])
            console.log('Winner' , Winner.IDorder , Winner.customerPhoneNumber , Winner.IDcustomer);

            await GetPaid(CloseAuction[IDiska],Winner.IDorder)
            
            // שליחת הודעה לזוכה
            IDmsg = 1040
            msg =  await GlobalFunction.getFields('systemMessages','msgContent',"WHERE IDmsg='"+IDmsg+"' AND msgLang='he'")
            pp10linkPerParticipant =  await GlobalFunction.setRoute(process.env.pBaseURL+'/pp11/'+Winner.IDorder+'/'+Winner.IDcustomer)
            if(msg!= 'notFound'){
                msg = msg[0].msgContent
                msg = msg.replace('[[pp10PersonalLink]]', pp10linkPerParticipant.url)
                console.log(msg);
            }
            await GlobalFunction.sendSMS(Winner.customerPhoneNumber,msg)


            // שליחת הודעה לבעל המכרז
            msg = ""
            IDmsg = 1041
            msg =  await GlobalFunction.getFields('systemMessages','msgContent',"WHERE IDmsg='"+IDmsg+"' AND msgLang='he'")
            if(msg!= 'notFound'){
                msg = msg[0].msgContent
                msg = msg.replace('[[iskaName]]', iskaName)
                msg = msg.replace('[[IDorder]]', Winner.IDorder)
            }
            await GlobalFunction.sendSMS(adminPhone,msg)

            allIDorder = ""
            CloseAuction[IDiska].forEach((Bidders)=>{
                allIDorder += Bidders.IDorder + ','
            })
            allIDorder = allIDorder.slice(0, -1) 
            await updateAllToStatus50(allIDorder)
            
        }else{
            console.log('אין מספיק משתתפים למכרז זה');
            return
            // קבלת נוסח הודעה
            IDmsg = 1042
            msg =  await GlobalFunction.getFields('systemMessages','msgContent',"WHERE IDmsg='"+IDmsg+"' AND msgLang='he'")
            if(msg!= 'notFound'){
                msg = msg[0].msgContent
                msg = msg.replace('[[iskaName]]', iskaName)
                console.log(msg);
            }
            // שליחת הודעה למפעיל המכרז
            await GlobalFunction.sendSMS(adminPhone,msg)
            allIDorder = ""
            // עדכון של כל המשתתפים לסטטוס 50
            CloseAuction[IDiska].forEach((Bidders)=>{
                allIDorder += Bidders.IDorder + ','
            })
            allIDorder = allIDorder.slice(0, -1) 
            await updateAllToStatus50(allIDorder)

        }
       i++
    })


    
}

Main()
    // console.log(Bidders.IDorder , Bidders.customerFirstName , Bidders.customerLastName ,Bidders.customerPhoneNumber);
                // console.log(msg , Bidders.IDcustomer );