/**************** CRONTAB EVERY 5 MIN ****************/3
// window development
// set NODE_ENV=development&& node t4m_pre_expiration_notification
// linux prod
// export NODE_ENV=prod&& node t4m_pre_expiration_notification


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
const GlobalFunction = require('./../helpers/admin/GlobalFunction');
 
// ==================================================================================
// SELECT ord.idx, ord.IDorder, ord.IDcustomer, cus.customerPhoneNumber FROM orders as ord LEFT JOIN customers as cus ON (ord.IDcustomer=cus.IDcustomer) WHERE ord.orderStatus=40 AND ord.IDsubOrder=1 AND  (NOW()-INTERVAL 35 MINUTE)>ord.t4m_pre_expiration_notification AND (IS NULL ord.timeToCompletePartsPayment-(INTERVAL 5 MINUTE))>=NOW()
// ==================================================================================

// let base_query = 'SELECT ord.IDorder, ord.IDcustomer, cus.customerPhoneNumber FROM orders as ord LEFT JOIN customers as cus ON (ord.IDcustomer=cus.IDcustomer) WHERE ord.orderStatus=40 AND ord.IDsubOrder=1 AND ord.timeToCompletePartsPayment<=(NOW() + INTERVAL 5 MINUTE)'
let base_query = `
    SELECT
    ORD.idx,
    ORD.IDorder,
    ORD.IDcustomer,
    cus.customerPhoneNumber
    FROM
    orders AS ORD
    LEFT JOIN customers AS cus
    ON
    (ORD.IDcustomer = cus.IDcustomer)
    WHERE
    ORD.orderStatus = 40 AND ORD.IDsubOrder = 1 AND(
        ORD.timeToCompletePartsPayment -INTERVAL 5 MINUTE
    ) >= NOW() AND (NOW() - INTERVAL 35 MINUTE) > ORD.t4m_pre_expiration_notification
`


    Pool.query(base_query, async function (err, result) {
        if (err) throw err;
        
        let customerPhoneNumberACC = '|'
        let baseMSG = 'בהזמנתך [[IDorder]] טרם שולמו כל התשלומים, לפרטים ...'
        rs = await GlobalFunction.getFields('systemMessages','msgContent',"WHERE IDmsg=1034 AND msgLang='he'") // can use 'he' language
        if (rs!='notFound') { baseMSG = rs[0].msgContent }
        let msg = baseMSG
        
        baseURL = "https://captain-c.com/";
        
        await result.forEach(async element => {
            if (customerPhoneNumberACC.indexOf('|'+element.customerPhoneNumber+'|')==-1) {
                let link = await GlobalFunction.setRoute(baseURL + "pp10/" + element.IDorder + "/" + element.IDcustomer);
                msg = baseMSG.replace('[[IDorder]]', element.IDorder)
                msg = msg.replace('[[pp10PersonalLink]]', link.url)
                GlobalFunction.sendSMS(element.customerPhoneNumber , msg)
                customerPhoneNumberACC += element.customerPhoneNumber+'|'
                Pool.query("UPDATE orders SET t4m_pre_expiration_notification=NOW() WHERE IDorder='"+element.IDorder+"' AND idx='"+element.idx+"'", async function (err, result) {  })
            }
        });
    });
