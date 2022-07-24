//******** cronjob every 1 hour ******

// window development
// set NODE_ENV=development&& node t4m_closing_expired_orders
// linux prod
// export NODE_ENV=prod&& node t4m_closing_expired_orders


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


let base_query = 'SELECT ord.IDorder, ord.IDiska, ord.IDpayment, ord.IDcustomer, ord.orderFeatureOptionsTotal, ord.orderUpsales, ord.orderCoupon, cus.customerPhoneNumber FROM orders as ord LEFT JOIN customers as cus ON (ord.IDcustomer=cus.IDcustomer) WHERE ord.orderStatus=40 AND ord.timeToCompletePartsPayment<NOW()';
 

    Pool.query(base_query, async function (err, result) {
        if (err) throw err;

        let customerPhoneNumberACC = '|'
        let baseMSG = 'הזמנה [[IDorder]] פגה תוקף'
        rs = await GlobalFunction.getFields('systemMessages','msgContent',"WHERE IDmsg=1035 AND msgLang='he'") // can use 'he' language
        if (rs!='notFound') { baseMSG = rs[0].msgContent }
        let msg = baseMSG

        await result.forEachAsync(async element => {
        // -- ביטול תשלומי J5 שחרור המסגרת בחברת האשראי?
                
            if(GlobalFunction.IsJsonString(element.orderFeatureOptionsTotal)) {
                oua = JSON.parse(element.orderFeatureOptionsTotal)
                for (ii=0; ii<oua.length; ii++) {                
                    let query = "update featureOptionsPerIska SET foInventory=foInventory+" + oua[ii].quantity + ' WHERE IDfo=' + oua[ii].IDfo + ' AND IDiska=' + element.IDiska;
                    Pool.query(query, function (err, result) {
                        if (err) throw err;
                    });
                }
            }
            // -- עדכון חזרה של מלאי מוצרים נלווים --
            if(GlobalFunction.IsJsonString(element.orderUpsales)) {
                oua = JSON.parse(element.orderUpsales)
                for (ii=0; ii<oua.length; ii++) {
                    let query = "update upSales SET upsaleInventory=upsaleInventory+'" + oua[ii].quantity + "', soldUnits=soldUnits-" + oua[ii].quantity + " WHERE IDupsale=" + oua[ii].IDupsale;
                    Pool.query(query, function (err, result) {
                        if (err) throw err;
                    });
                }
            }
            
            // -- עדכון חזרה של מלאי קופון אם היה כזה בהזמנה --
            if (element.orderCoupon!=0) {
                let query = "update coupons SET couponCounter=couponCounter-1 WHERE couponCode='" + element.orderCoupon + "' AND IDiska=" + element.IDiska;
                Pool.query(query, function (err, result) {
                    if (err) throw err;
                    console.log(result.affectedRows);
                });
            }

            // -- עדכון סטטוס התשלום ל 3 פג תוקף --
            let update_payment_status_query = "update payments SET paymentStatus=3 WHERE IDpayment=" + element.IDpayment;
            Pool.query(update_payment_status_query, function (err, result) {
                if (err) throw err;
                console.log(result.affectedRows);
            });

            // -- עדכון סטטוס ההזמנה ל 60 פגה תוקף --
            let update_order_status_query = "update orders SET orderStatus=60 WHERE IDorder=" + element.IDorder;
            Pool.query(update_order_status_query, function (err, result) {
                if (err) throw err;
            });

            // -- שליחת הודעת SMS אל הלקוח המזמין כי ההזמנה פגה תוקף ומבוטלת --
            if (customerPhoneNumberACC.indexOf('|'+element.customerPhoneNumber+'|')==-1) {
                msg = baseMSG.replace('[[IDorder]]', element.IDorder)
                GlobalFunction.sendSMS(element.customerPhoneNumber , msg)
                customerPhoneNumberACC += element.customerPhoneNumber+'|'
            }
        });    
    });
