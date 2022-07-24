var Pool = require('./../../core/db/dbPool')
const GlobalFunction = require('./../../helpers/admin/GlobalFunction')


var format = require('date-fns/format')
var parseISO = require('date-fns/parseISO')
const _ = require('underscore');


const AddCustomer = async function(Order){
    return new Promise(async (resolve, reject) => {
        let IDcustomer = await GlobalFunction.getRandNumber(6 , 'customers' , 'IDcustomer');

        Pool.query('INSERT INTO customers (IDcustomer, customerFirstName, customerLastName, customerPhoneNumber, customerEmail, IDparent, creationDate) VALUES ((?),(?),(?),(?),(?),0,NOW());',[IDcustomer , Order.customerFirstName, Order.customerLastName, Order.customerPhoneNumber, Order.customerEmail], async(err, row ,fields) => {
            resolve(IDcustomer)
        })
    })
}



const AddManualOrder = async function(IDsapak,IDiska,Order){
    // console.log(IDsapak,IDiska,Order);

  

    return new Promise(async(resolve, reject) => {

        let IDcustomer = await GlobalFunction.getFields('customers' , 'IDcustomer' , "WHERE customerPhoneNumber = '"+ Order.customerPhoneNumbe + "'")
        if(IDcustomer == "notFound"){
            IDcustomer = await AddCustomer(Order)
        }else{
            IDcustomer = row[0].IDcustomer
        }
        let IDorder = await GlobalFunction.getRandNumber(6 , 'orders' , 'IDorder');

        // console.log("Added order", Order.manualOrder);
        // if(Order.manualOrder == 'true'){
        //     Order.manualOrder = 1
        // }else{
        //     Order.manualOrder = 0
        // }
    
        Order.manualOrder = 1;
        
        let res
        if(Order.iskaType == 'professionals'){
            res = await AddManualOrderProfessionals(IDsapak,IDiska,Order,IDcustomer,IDorder)
        }
        if(Order.iskaType == 'attraction'){
            res = await AddManualOrderAttraction(IDsapak,IDiska,Order,IDcustomer,IDorder)
        }

        resolve(res)
        

    })
}


const AddManualOrderProfessionals = async function(IDsapak,IDiska,Order,IDcustomer,IDorder){
    return new Promise(async (resolve, reject) => {
        // console.log(IDsapak,IDiska,Order,IDcustomer,IDorder);


        // טעינה של כל האפשרויות למוצר לתוך מערך
        let orderFeatureOptionsTotal = []
        await Order.featureOptions.forEachAsync(async(element) => {
            if(!isNaN(element.IDfo)){
                let cost = await GlobalFunction.getFeatureOptionCost(element.IDfo, IDiska)
                orderFeatureOptionsTotal.push({IDfo:element.IDfo,quantity:Order.ticketNumberForOrder,cost:"0"})
                // orderFeatureOptionsTotal.push({IDfo:element.IDfo,quantity:Order.ticketNumberForOrder,cost})
            }
        });
        orderFeatureOptionsTotal = JSON.stringify(orderFeatureOptionsTotal)

        let orderTicketsPaid = [] 
        if(Order.ticketNumberForOrder != '' && Order.price  != ''){
            orderTicketsPaid = [{
                quantity:Order.ticketNumberForOrder,
                cost:Order.price
            }]
            orderTicketsPaid = JSON.stringify(orderTicketsPaid)
        }else{
            orderTicketsPaid = '[]'
        }

   
        let sql = "INSERT INTO orders (IDorder, IDIska, IDsubOrder, orderDate, IDcustomer, IDpayment, IDsapak, orderType, orderStatus, IDinlay, manualOrder, orderFeatureOptionsTotal, orderFeatureOptionsPaid, orderUpsales, orderCoupon, orderCouponAmount, timeToCompletePartsPayment, t4m_pre_expiration_notification, orderTicketsTotal, orderTicketsPaid, orderPartsTotal, orderPartsPaid ,orderFriendsShareDiscount, orderFriendsShareDiscountAmount, orderShipment, orderShipmentFirstName, orderShipmentLastName, orderShipmentPhoneNumber, orderShipmentCity, orderShipmentStreet, orderShipmentHouseNumber, orderShipmentAppartment, orderShipmentRemarks, IDbranch) VALUES ((?), (?), '1', NOW(), (?), '0', (?), 'משלם על הכל', '50', (?), (?), (?), (?), '[]', '0', '0.00', NOW(), NOW(), (?), (?), '0', '0', '0', '0', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '0')"

        
        Pool.query(sql,[IDorder,IDiska,IDcustomer,IDsapak,Order.IDinlay,Order.manualOrder,orderFeatureOptionsTotal,orderFeatureOptionsTotal,orderTicketsPaid, orderTicketsPaid], async(err, row ,fields) => {
            if(err){
                resolve({status : 'err'})
                console.log(err);
                return 
            }
            if(row.affectedRows > 0){
                resolve({status : 'success' , data:row[0] })  
            }else{
                resolve({status : 'err'})

            }
        })


    })
}
const AddManualOrderAttraction = async function(IDsapak,IDiska,Order,IDcustomer,IDorder){
    return new Promise(async (resolve, reject) => {
    // console.log(IDsapak,IDiska,Order,IDcustomer,IDorder);

    // orderTicketsTotal = [{"ticketType":43,"ttName":"אזרח ותיק","quantity":3,"cost":"36.00"},{"ticketType":42,"ttName":"מבוגר","quantity":3,"cost":"36.00"}]
    // orderTicketsPaid = [{"IDiska":7344375,"ticketType":43,"ttName":"אזרח ותיק","quantity":3,"cost":"36.00"},{"IDiska":7344375,"ticketType":42,"ttName":"מבוגר","quantity":3,"cost":"36.00"}]
    
    orderTicketsTotal = []
    orderTicketsPaid = []
    let flagFirst = true;
    Order.TicketTypes.forEach(element => {
        if(element.quantity > 0){
            price = 0;
            if(flagFirst){
                flagFirst = false;
                price = Order.price;
            }
            orderTicketsTotal.push({ticketType:element.IDticketType,ttName:element.ttName,quantity:element.quantity,cost:price})
            orderTicketsPaid.push({IDiska:IDiska,ticketType:element.IDticketType,ttName:element.ttName,quantity:element.quantity,cost:price})
        }
    });
  
    orderTicketsTotal = JSON.stringify(orderTicketsTotal)
    orderTicketsPaid = JSON.stringify(orderTicketsPaid)

    // -- אם יש הושבה בעסקה מעדכן מספרי ההזמנה וסאב הזמנה לכסאות שנבחרו בטבלת chairs --
    Pool.query("UPDATE chairs SET IDorder='"+IDorder+"', IDsubOrder='1' WHERE IDiska='"+IDiska+"' AND IDinlay='"+Order.IDinlay+"' AND IDchair IN (" + Order.chairsSelected + ")", async (err, rs ,fields) => {
        console.log(rs, err)
        if (rs.affectedRows>0) { console.log('updated chairs status inventory') }
        else { console.log('*FAILED* to update chairs status!') }
    })

    let sql = "INSERT INTO orders (IDorder, IDIska, IDsubOrder, orderDate, IDcustomer, IDpayment, IDsapak, orderType, orderStatus, IDinlay, manualOrder, orderFeatureOptionsTotal, orderFeatureOptionsPaid, orderUpsales, orderCoupon, orderCouponAmount, timeToCompletePartsPayment, t4m_pre_expiration_notification, orderTicketsTotal, orderTicketsPaid, orderPartsTotal, orderPartsPaid ,orderFriendsShareDiscount, orderFriendsShareDiscountAmount, orderShipment, orderShipmentFirstName, orderShipmentLastName, orderShipmentPhoneNumber, orderShipmentCity, orderShipmentStreet, orderShipmentHouseNumber, orderShipmentAppartment, orderShipmentRemarks, IDbranch) VALUES ((?), (?), '1', NOW(), (?), '0', (?), 'משלם על הכל', '50', (?), (?), (?), (?), '[]', '0', '0.00', NOW(), NOW(), (?), (?), '0', '0', '0', '0', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '0')"

        
    Pool.query(sql,[IDorder,IDiska,IDcustomer,IDsapak,Order.IDinlay,Order.manualOrder,"[]","[]",orderTicketsTotal, orderTicketsPaid], async(err, row ,fields) => {
        if(err){
            resolve({status : 'err'})
            console.log(err);
            return 
        }
        console.log(row);
        if(row.affectedRows > 0){
            resolve({status : 'success' , data:row[0] })  
        }else{
            resolve({status : 'err'})

        }
    })


    })
}



const getOrderByIDsapak = async function(IDsapak,dateStart,dateEnd){
    if(!dateStart){
        dateStart = new Date(Date.now());
        dateStart.setDate(dateStart.getDate()-14);
        dateStart = format(dateStart ,'yyyy-MM-dd 00:00:00')
    }else{
        dateStart = format(parseISO(dateStart) ,'yyyy-MM-dd 00:00:00')
    }
    if(!dateEnd){
        dateEnd = format(new Date(Date.now()),'yyyy-MM-dd 23:59:59')
    }else{
        dateEnd = format(new Date(parseISO(dateEnd)),'yyyy-MM-dd 23:59:59')  
    }

    console.log(dateStart,dateEnd);

    
  
    return new Promise(async (resolve, reject) => {
        let sql = "SELECT ord.IDorder, ord.OrderType, CONCAT(stat.statusDesc,' (',ord.orderStatus,')') as orderStatus, ord.orderDate, isk.iskaName, ord.orderTicketsTotal, ord.orderTicketsPaid, ord.orderPartsTotal, ord.orderPartsPaid, CONCAT(cus.customerFirstName,' ',cus.customerLastName) as customerName, ord.IDpayment, IFNULL((SELECT sum(paymentAmount) FROM payments WHERE IDorder=ord.IDorder AND (paymentStatus=0 OR paymentStatus=1)),0) as orderTotalPayment, IFNULL(isk.iskaCurrency,'ils') as iskaCurrency, ord.manualOrder as manualOrder FROM `orders` as ord LEFT JOIN customers as cus ON (ord.IDcustomer=cus.IDcustomer) LEFT JOIN iskaot as isk ON (ord.IDiska=isk.IDiska) LEFT JOIN orderStatusList as stat ON (ord.orderStatus=stat.IDstatus and stat.statusLang='he') LEFT JOIN payments as pay ON (ord.IDpayment=pay.IDpayment) WHERE ord.IDsapak=(?) and ord.orderdate>=(?) and ord.orderDate<=(?) and ord.IDsubOrder='1' order by ord.IDorder, ord.idx"
        Pool.query(sql,[IDsapak,dateStart,dateEnd], async(err, row ,fields) => {
            if(err){
                console.log(err);
                reject(err)
            }
            let primaryOrder = []
            let Orders = []
            // console.log('row321123', row[0]);
            // console.log('length' , row.length);
            row = JSON.parse(JSON.stringify(row))
            allOrder = _.groupBy(row, function(ele){
                return ele.IDorder
            });
            
            // console.log('allOrder321123', allOrder);
            Object.keys(allOrder).forEach(IDorder => {
                let subOrder = _.where(row,{IDorder:parseInt(IDorder)});
                primaryOrder.push({IDorder:IDorder , subOrder:subOrder})
            });

            primaryOrder.forEach(Order => {
                let iskaName = ""
                let orderTicketsTotal = "" 

                Order.subOrder.forEach(subOrder => {
                    if(subOrder.iskaName)
                    iskaName += subOrder.iskaName + '</br>'

                    if(GlobalFunction.IsJsonString(subOrder.orderTicketsTotal)){
                        TicketsTotal = JSON.parse(subOrder.orderTicketsTotal)
                        orderTicketsTotal += TicketsTotal[0].quantity + '</br>'
                        // orderTicketsTotal += TicketsTotal[0].quantity + ' / ' + TicketsTotal[0].cost + '</br>'
                    }

                })
                Order.IDorder = Order.subOrder[0].IDorder
                Order.customerName = Order.subOrder[0].customerName
                Order.iskaName = iskaName
                Order.orderTicketsTotal = orderTicketsTotal
                Order.orderStatus = Order.subOrder[0].orderStatus
                Order.OrderType = Order.subOrder[0].OrderType
                Order.orderDate = Order.subOrder[0].orderDate
                Order.orderTotalPayment = Order.subOrder[0].orderTotalPayment
                Order.iskaCurrency = Order.subOrder[0].iskaCurrency
                Order.manualOrder = Order.subOrder[0].manualOrder;
            })
            
            for(let i = 0; i< primaryOrder.length; i++){
                let element = primaryOrder[i];
                if(element.manualOrder){
                    console.log("element.IDorder4564234", element.IDorder);
                    const varResOrder =  await getOrderDetails(element.IDorder);
                    // console.log('varResOrder46787',varResOrder);
                    let summ = 0;
                    if(Array.isArray(varResOrder.pp11toShow.iskaot)){
                        varResOrder.pp11toShow.iskaot.forEach(el => 
                            el.paidTickets.forEach(eltick => summ +=Number(eltick.cost))
                            )
                    }
                    element.orderTotalPayment = summ;
                    
                }
            }
    
            // console.log(primaryOrder , primaryOrder.length);
            resolve({status : 'success' , data:primaryOrder })
        })
    })
}



const getAgentsByIDsapak = async function(IDsapak){

    
  
    return new Promise(async (resolve, reject) => {
        let sql = "SELECT case when customers.IDparent is null or customers.IDparent = 0 then customers.idcustomer else customers.IDparent end as IDParent, case when customers.IDparent is null or customers.IDparent = 0 then true else false end as isParent, ordMinDate.IDcustomer, ordMinDate.IDsapak, min(ordMinDate.orderDate)  as FirstOrderDate, customers.creationDate as creationDateCustomer,  firstOrd.IDorder, firstOrd.IDIska, firstOrd.IDinlay, iskaot.IskaName, case when inlays.inlaySchedule is null then firstOrd.orderDate else inlays.inlaySchedule end as inlaySchedule  ,   customers.customerFirstName, customers.customerLastName, customers.customerPhoneNumber, customers.customerEmail FROM `orders` as ordMinDate left join orders as firstOrd on (ordMinDate.IDcustomer = firstOrd.IDcustomer and ordMinDate.orderDate = firstOrd.orderDate ) left join iskaot on (iskaot.idiska = firstOrd.IDIska) left join inlays on (firstOrd.IDinlay = inlays.IDinlay)  join customers on (customers.IDcustomer = ordMinDate.idcustomer and not (customers.IDcustomer is null or customers.IDcustomer = 0)) where  ordMinDate.idsapak=(?) group by ordMinDate.IDcustomer   order by idparent, isparent desc, FirstOrderDate desc"

        Pool.query(sql,[IDsapak], async(err, row ,fields) => {
            if(err){
                console.log(err);
                reject(err)
            }

            row = JSON.parse(JSON.stringify(row))
            allOrder = _.groupBy(row, function(ele){
                return ele.IDParent
            });
            
            const arrResult = [];
            Object.keys(allOrder).forEach(IDParent =>{
                let isParent = false;
                let isChild = false;

                allOrder[IDParent].forEach(val =>{
                    if(val.isParent){
                        isParent=true;
                    }else{
                        isChild=true;
                    }
                })

                if(isParent && isChild){
                    allOrder[IDParent].forEach(val =>{
                        arrResult.push(val);
                    })
                }
            })
           
            resolve({status : 'success' , data:arrResult })
        })
    })
}


const getReportIskaot = async function(IDsapak, dateStartInlay, dateEndInlay, NoFilterInlay, dateStartCreactionDate, dateEndCreationDate, isActive, noFilterIsActive, iskaType){

    return new Promise(async (resolve, reject) => {
        let sql = "SELECT iskaot.IDiska, iskaot.iskaName, iskaot.iskaType, iskaot.isActive, iskaot.creationDate, inlays.inlaySchedule FROM `iskaot` left join inlays on (iskaot.IDiska = inlays.IDiska) WHERE iskaot.idsapak=(?)  and (inlays.inlaySchedule>=(?) and inlays.inlaySchedule<=(?) or (?) ) and (iskaot.creationDate>=(?) and iskaot.creationDate<=(?)) and (iskaot.isActive = (?) or (?))   group by iskaot.IDiska, iskaot.iskaName, iskaot.iskaType, iskaot.isActive, iskaot.creationDate"

        if(dateEndInlay){
            dateEndInlay = new Date(dateEndInlay);
            dateEndInlay.setHours(23,59,59,999);
        }

        if(dateEndCreationDate){
            dateEndCreationDate = new Date(dateEndCreationDate);

            dateEndCreationDate.setHours(23,59,59,999);
        }

        
        Pool.query(sql,[IDsapak, dateStartInlay, dateEndInlay, NoFilterInlay, dateStartCreactionDate, dateEndCreationDate, isActive,noFilterIsActive ], async(err, row ,fields) => {
            if(err){
                console.log(err);
                reject(err)
            }

            row = JSON.parse(JSON.stringify(row))
            // allOrder = _.groupBy(row, function(ele){
            //     return ele.IDParent
            // });
            
            // const arrResult = [];
            // Object.keys(allOrder).forEach(IDParent =>{
            //     let isParent = false;
            //     let isChild = false;

            //     allOrder[IDParent].forEach(val =>{
            //         if(val.isParent){
            //             isParent=true;
            //         }else{
            //             isChild=true;
            //         }
            //     })

            //     if(isParent && isChild){
            //         allOrder[IDParent].forEach(val =>{
            //             arrResult.push(val);
            //         })
            //     }
            // })
           
            resolve({status : 'success' , data:row })
        })
    })
}
const getCustomersByIska = async function(IDsapak,IDiska){

    return new Promise(async (resolve, reject) => {
        console.log("IDiskasdfljhsdlfksf",IDiska);
        let sql = "SELECT min(orders.orderdate) as minDateOrder, orders.IDIska, orders.IDcustomer,customers.customerFirstName, customers.customerLastName, customers.customerPhoneNumber, customers.customerEmail FROM `orders` join customers on (orders.IDcustomer = customers.IDcustomer) where IDIska = (?) group by IDcustomer, IDIska order by minDateOrder"
        // let sql = "SELECT min(orders.orderdate) as minDateOrder, orders.IDIska, orders.IDcustomer,customers.customerFirstName, customers.customerLastName, customers.customerPhoneNumber, customers.customerEmail FROM `orders` join customers on (orders.IDcustomer = customers.IDcustomer) group by IDcustomer, IDIska order by minDateOrder"

        
        Pool.query(sql,[IDiska], async(err, row ,fields) => {
            if(err){
                console.log(err);
                reject(err)
            }

            row = JSON.parse(JSON.stringify(row))
            resolve({status : 'success' , data:row })
        })
    })
}


async function getProfessionalsOrder(IDorder, IDcustomer, rs){

    let isAdminMode = false
    if(IDcustomer == 0){
        isAdminMode = true
    }
    console.log('adminmode='+isAdminMode)

    return new Promise(async (resolve, reject) => {

    
    let orderCouponDetails = []
    let orderFriendsShareDiscountDetails = []
    let iskaot = []
    
    let paidTickets = []
    let orderFeatureOptions = []
    let orderUpsales = []
    let sapakLogo =  rs[0].IDsapak + '/' + rs[0].sapakLogo
    let sapakName =  rs[0].sapakName
    
    let FeatureOptionsName = 'אפשרות'
    let orderUpsalesName = 'מוצר נלווה'
    let orderCoupon = ''
    let orderCouponAmount = 0
    let orderFriendsShareDiscountAmount = 0
    let paymentAmount = 0
    let paymentACC = '|'
    if (rs.length>0) { 
        
        let iskaCurrency = rs[0].iskaCurrency
        let iskaType = rs[0].iskaType
        let orderType = rs[0].orderType
        let orderStatusDescription = rs[0].orderStatus
        rs2 = await GlobalFunction.getFields('orderStatusList','statusDesc',"WHERE IDstatus='"+rs[0].orderStatus+"' AND statusLang='he'")
        
        if(rs2!='notFound'){ orderStatusDescription = rs2[0].statusDesc }
        
        // -- תחילת לולאה על כל רשומות ההזמנה --
        await rs.forEachAsync(async (element) => {

            if (isAdminMode || element.IDcustomer==IDcustomer) {
                paidTickets = []
                orderFeatureOptions = []
                orderUpsales = []
                // element.iskaType=='product-food' לתקן בדיקה של אהוד FIXME
                // orderPartsTotal
                // orderPartsPaid
                // || element.iskaType=='product-food'

                // --- לסוגי עסקה בעלי מקצוע\מסעדה ואטרקציה ---
                if (element.iskaType=='professionals' || element.iskaType=='attraction') {
                    // -- מספר כרטיסים + מחיר שלהם --
                    // if(GlobalFunction.IsJsonString(element.orderTicketsPaid) && element.orderTicketsPaid.length > 5) {
                    // console.log(element.orderTicketsPaid);
                    if(GlobalFunction.IsJsonString(element.orderTicketsPaid)) {
                        oua = JSON.parse(element.orderTicketsPaid);
                        for (ii=0; ii<oua.length; ii++) { 
                            paidTickets.push({ "name":"כרטיסים" , "quantity":oua[ii].quantity ,  "cost":oua[ii].cost })
                        }
                    }

                    // -- אפשרויות למוצר שנבחרו כל אחת בשורה + מחיר --
                    if(GlobalFunction.IsJsonString(element.orderFeatureOptionsPaid)) {
                        oua = JSON.parse(element.orderFeatureOptionsPaid)
                        if(oua)
                        await oua.forEachAsync(async(oua) => {
                            FeatureOptionsName = 'אפשרות'
                            rs2 = await GlobalFunction.getFields('featureOptions','foName',"WHERE IDfo='"+oua.IDfo+"' LIMIT 1")
                            if(rs2!='notFound'){ FeatureOptionsName = rs2[0].foName }
                            orderFeatureOptions.push({ "IDfo":oua.IDfo , "name":FeatureOptionsName , "quantity":oua.quantity , "cost":oua.cost })
                        })
                    }
                }

                
                    // -- מוצרים נלווים שנבחרו כל אחד בשורה --
                    // console.log(element.orderUpsales);
                    if(GlobalFunction.IsJsonString(element.orderUpsales)) {
                        oua = JSON.parse(element.orderUpsales)
                        
                        await oua.forEachAsync(async(oua) => {
                            orderUpsalesName = 'מוצר נלווה'
                            rs2 = await GlobalFunction.getFields('upSales','upsaleName',"WHERE IDupsale='"+oua.IDupsale+"' LIMIT 1")
                            if(rs2!='notFound'){ orderUpsalesName = rs2[0].upsaleName }
                            orderUpsales.push({ "IDupsale":oua.IDupsale , "name":orderUpsalesName , "quantity":oua.quantity , "cost":parseFloat(oua.cost).toFixed(2) })
                        });
                    }
                    
                    // -- הנחת קופון אם יש - יוצג בסוף לאחר כל רשימת הכרטיסים ואפשרויות המוצר --
                    if (element.orderCouponAmount!=0) {
                        if (orderCoupon!='') { orderCoupon = orderCoupon + ', '}
                        orderCoupon = orderCoupon + element.orderCoupon.toString()
                        orderCouponAmount = orderCouponAmount - parseFloat(element.orderCouponAmount)
                    }
                    
                    // --הנחת שיתוף חברים אם יש - יוצג בסוף לאחר כל רשימת הכרטיסים ואפשרויות המוצר --
                    if (parseFloat(element.orderFriendsShareDiscountAmount)!=0) {
                        orderFriendsShareDiscountAmount = orderFriendsShareDiscountAmount - parseFloat(element.orderFriendsShareDiscountAmount)
                    }
                    
                    /*
                    לעסקה בעל מקצוע
                    מספר כרטיסים + מחיר שלהם
                    אפשרויות למוצר שנבחרו כל אחת בשורה + מחיר
                    מוצרים נלווים שנבחרו כל אחד בשורה
                    הושבה אם היה
                    --------------
                    הנחת קופון אם יש - יוצג בסוף לאחר כל רשימת הכרטיסים ואפשרויות המוצר
                    הנחת שיתוף חברים אם יש - יוצג בסוף לאחר כל רשימת הכרטיסים ואפשרויות המוצר
                    -------------
                    סה"כ ששולם
                    */

                    // --- סוכם סהכ כמה שולם בפועל מטבלת התשלומים ---
                    if (paymentACC.indexOf('|'+element.IDpayment.toString()+'|')==-1) {
                        paymentAmount = paymentAmount + parseFloat(element.paymentAmount)
                        paymentACC += element.IDpayment.toString()+'|'
                    }
                    console.log('paymentAmount='+paymentAmount)
                
                    iskaot.push({ 
                        "IDiska":element.ordIDiska ,
                        "IDsubOrder":element.IDsubOrder , 
                        "iskaName":element.iskaName,
                        "customerName":element.customerFirstName +' '+ element.customerLastName,
                        "inlaySchedule":element.inlaySchedule, 
                        "branchAddress":element.branchAddress ,
                        "orderStatus":element.orderStatus,
                        "paidTickets":paidTickets ,
                        "orderFeatureOptions":orderFeatureOptions , 
                        "orderUpsales":orderUpsales 
                    })
            }
        })
        // -- סיום הלולאה על כל רשומות ההזמנה --


        //if (orderCouponAmount!=0) {  orderCouponDetails.push({ "name":"הנחת קופון" , "couponCode":orderCoupon , "amount":orderCouponAmount }) }
        //if (orderFriendsShareDiscountAmount!=0) { orderFriendsShareDiscountDetails.push({ "name":"הנחת שיתוף חברים" , "blankSpace":"" , "amount":orderFriendsShareDiscountAmount }) }
        
        if (orderCouponAmount!=0) {  orderCouponDetails = { "name":"הנחת קופון" , "couponCode":orderCoupon , "amount":parseFloat(orderCouponAmount).toFixed(2) } }
        if (orderFriendsShareDiscountAmount!=0) { orderFriendsShareDiscountDetails = { "name":"הנחת קפטן הפצה" , "amount":parseFloat(orderFriendsShareDiscountAmount).toFixed(2)  } }
        
        if (isNaN(IDcustomer)) { IDcustomer = 0 }
        let finalResponse = {
            "IDorder": IDorder,
            "IDcustomer": IDcustomer,
            "iskaCurrency": iskaCurrency,
            "orderType": orderType,
            "sapakLogo": sapakLogo,
            "sapakName": sapakName,
            "iskaType": iskaType,
            "iskaot": iskaot,
            "orderStatusDescription": orderStatusDescription,
            "orderCoupon": orderCouponDetails,
            "orderFriendsShareDiscount": orderFriendsShareDiscountDetails,
            "totalPayment": parseFloat(paymentAmount).toFixed(2),
            "manualOrder": rs[0].manualOrder
        }
        resolve({ "pp11toShow":finalResponse})
        return
    
    } else {
        // --- הזמנה לא קיימת ---
        resolve({redirectTo : "/admin" , err:3301})  // -- להעביר לדף ראשי ללא הסבר --
        return
    }
})
}

async function getChairs(IDorder){
   return new Promise(async (resolve, reject) =>{
       let sql = "SELECT hallsMatrix.chairName  as chairName, hallsMatrix.idChair as IDchair, chairs.IDiska as IDiska FROM orders left join chairs on orders.IDorder = chairs.IDorder JOIN hallsMatrix on chairs.idx = hallsMatrix.IDchair where orders.IDorder=(?)"
          await Pool.query(sql,IDorder, async(err, row ,fields) => {
              console.log("chairs", row)
               if(err){
                   reject(err);
                   
               }else{
                   resolve(row);
               }
           });
        }
   );
}

async function getAttractionOrder(IDorder, IDcustomer, rs){

    let isAdminMode = false
    if(IDcustomer == 0){
        isAdminMode = true
    }
    console.log('adminmode='+isAdminMode)

    return new Promise(async (resolve, reject) => {
    
    let orderCouponDetails = []
    let orderFriendsShareDiscountDetails = []
    let iskaot = []
    
    let paidTickets = []
    let orderFeatureOptions = []
    let orderUpsales = []
    
    let sapakLogo =  rs[0].IDsapak + '/' + rs[0].sapakLogo
    let sapakName =  rs[0].sapakName
    console.log('sapakName = ' , sapakName);

    let FeatureOptionsName = 'אפשרות'
    let orderUpsalesName = 'מוצר נלווה'
    let orderCoupon = ''
    let orderCouponAmount = 0
    let orderFriendsShareDiscountAmount = 0
    let paymentAmount = 0
    let paymentACC = '|'
    if (rs.length>0) { 

        // console.log('rs12345',rs);
        // console.log('rs12345 buffer',rs[0].manualOrder);
    // let chairs = await getChairs(IDorder);
    // const chairsresult = [];
    // for(let i=0; i<rs.length; i++) {
    //     let matrix = await GlobalFunction.getHallsMatrixGlobal(rs[i].ordIDiska);
    //     matrix = matrix.data;
    //     console.log('matrix987',matrix);
    //     console.log('chairs987',chairs)
    //     Object.keys(matrix).forEach(key => {
    //         let row = matrix[key];
    //         if(Array.isArray(row)){
    //             row.forEach(element => {
    //               let el = chairs.find(elname => elname.IDchair === element.Idx);
    
    //               if (el){
    //                   element.IDiska = el.IDiska
    //                 chairsresult.push(element);
    //               }
    //             });
    //         }
    //       });
    // };
      
    
        
        let iskaCurrency = rs[0].iskaCurrency
        let iskaType = rs[0].iskaType
        let orderType = rs[0].orderType
        let orderStatusDescription = rs[0].orderStatus
        rs2 = await GlobalFunction.getFields('orderStatusList','statusDesc',"WHERE IDstatus='"+rs[0].orderStatus+"' AND statusLang='he'")
        
        
        if(rs2!='notFound'){ orderStatusDescription = rs2[0].statusDesc }
        
        // -- תחילת לולאה על כל רשומות ההזמנה --
        await rs.forEachAsync(async (element) => {
            console.log('elementelement' , element);
            let chairsresult = await GlobalFunction.getChairsSelectedByIdiskaAndIDinlay(element.IDorder,element.ordIDiska,element.IDinlay)
            
            if (isAdminMode || element.IDcustomer==IDcustomer) {
                paidTickets = []
                orderFeatureOptions = []
                orderUpsales = []
                if (element.iskaType=='attraction') {
                    // -- מספר כרטיסים + מחיר שלהם --
                    // [{"ticketType":"29", "ttName":"חיילת", "quantity":1, "cost":"33.00"},{"ticketType":"42", "ttName":"סיני", "quantity":0, "cost":"0.00"}]
                    if(GlobalFunction.IsJsonString(element.orderTicketsPaid)) {
                        oua = JSON.parse(element.orderTicketsPaid);
                        for (ii=0; ii<oua.length; ii++) { 
                            if(oua[ii].quantity > 0){
                                paidTickets.push({ "name":oua[ii].ttName , "quantity":oua[ii].quantity ,  "cost":oua[ii].cost })
                            }
                        }
                    }

                }

                
                    // -- מוצרים נלווים שנבחרו כל אחד בשורה --
                    // console.log(element.orderUpsales);
                    if(GlobalFunction.IsJsonString(element.orderUpsales)) {
                        oua = JSON.parse(element.orderUpsales)
                        
                        await oua.forEachAsync(async(oua) => {
                            orderUpsalesName = 'מוצר נלווה'
                            rs2 = await GlobalFunction.getFields('upSales','upsaleName',"WHERE IDupsale='"+oua.IDupsale+"' LIMIT 1")
                            if(rs2!='notFound'){ orderUpsalesName = rs2[0].upsaleName }
                            orderUpsales.push({ "IDupsale":oua.IDupsale , "name":orderUpsalesName , "quantity":oua.quantity , "cost":parseFloat(oua.cost).toFixed(2) })
                        });
                    }
                    
                    // -- הנחת קופון אם יש - יוצג בסוף לאחר כל רשימת הכרטיסים ואפשרויות המוצר --
                    if (element.orderCouponAmount!=0) {
                        if (orderCoupon!='') { orderCoupon = orderCoupon + ', '}
                        orderCoupon = orderCoupon + element.orderCoupon.toString()
                        orderCouponAmount = orderCouponAmount - parseFloat(element.orderCouponAmount)
                    }
                    
                    // --הנחת שיתוף חברים אם יש - יוצג בסוף לאחר כל רשימת הכרטיסים ואפשרויות המוצר --
                    if (parseFloat(element.orderFriendsShareDiscountAmount)!=0) {
                        orderFriendsShareDiscountAmount = orderFriendsShareDiscountAmount - parseFloat(element.orderFriendsShareDiscountAmount)
                    }
                    
                    /*
                    לעסקה בעל מקצוע
                    מספר כרטיסים + מחיר שלהם
                    אפשרויות למוצר שנבחרו כל אחת בשורה + מחיר
                    מוצרים נלווים שנבחרו כל אחד בשורה
                    הושבה אם היה
                    --------------
                    הנחת קופון אם יש - יוצג בסוף לאחר כל רשימת הכרטיסים ואפשרויות המוצר
                    הנחת שיתוף חברים אם יש - יוצג בסוף לאחר כל רשימת הכרטיסים ואפשרויות המוצר
                    -------------
                    סה"כ ששולם
                    */

                    // --- סוכם סהכ כמה שולם בפועל מטבלת התשלומים ---
                    if (paymentACC.indexOf('|'+element.IDpayment.toString()+'|')==-1) {
                        paymentAmount = paymentAmount + parseFloat(element.paymentAmount)
                        paymentACC += element.IDpayment.toString()+'|'
                    }
                    console.log('paymentAmount='+paymentAmount)
                
                    iskaot.push({ 
                        "IDiska":element.ordIDiska ,
                        "IDsubOrder":element.IDsubOrder , 
                        "iskaName":element.iskaName,
                        "customerName":element.customerFirstName +' '+ element.customerLastName,
                        "inlaySchedule":element.inlaySchedule, 
                        "branchAddress":element.branchAddress ,
                        "orderStatus":element.orderStatus,
                        "paidTickets":paidTickets ,
                        "orderFeatureOptions":orderFeatureOptions , 
                        "orderUpsales":orderUpsales,
                        "chairs": chairsresult.data,
                    })
            }
        })
        // -- סיום הלולאה על כל רשומות ההזמנה --


        //if (orderCouponAmount!=0) {  orderCouponDetails.push({ "name":"הנחת קופון" , "couponCode":orderCoupon , "amount":orderCouponAmount }) }
        //if (orderFriendsShareDiscountAmount!=0) { orderFriendsShareDiscountDetails.push({ "name":"הנחת שיתוף חברים" , "blankSpace":"" , "amount":orderFriendsShareDiscountAmount }) }
        
        if (orderCouponAmount!=0) {  orderCouponDetails = { "name":"הנחת קופון" , "couponCode":orderCoupon , "amount":parseFloat(orderCouponAmount).toFixed(2) } }
        if (orderFriendsShareDiscountAmount!=0) { orderFriendsShareDiscountDetails = { "name":"הנחת קפטן הפצה" , "amount":parseFloat(orderFriendsShareDiscountAmount).toFixed(2)  } }
        
        if (isNaN(IDcustomer)) { IDcustomer = 0 }
        let finalResponse = {
            "IDorder": IDorder,
            "IDcustomer": IDcustomer,
            "iskaCurrency": iskaCurrency,
            "orderType": orderType,
            "iskaType": iskaType,
            "iskaot": iskaot,
            "sapakLogo": sapakLogo,
            "sapakName":sapakName,
            "orderStatusDescription": orderStatusDescription,
            "orderCoupon": orderCouponDetails,
            "orderFriendsShareDiscount": orderFriendsShareDiscountDetails,
            "totalPayment": parseFloat(paymentAmount).toFixed(2),
            "manualOrder": rs[0].manualOrder
        }
        resolve({ "pp11toShow":finalResponse})
        return
    
    } else {
        // --- הזמנה לא קיימת ---
        resolve({redirectTo : "/admin" , err:3301})  // -- להעביר לדף ראשי ללא הסבר --
        return
    }
})
}

async function getProductFoodOrder(IDorder, IDcustomer, rs) {
    console.log('IDcustomer --->' , IDcustomer);
    let isAdminMode = false
    if(IDcustomer == 0){
        isAdminMode = true
    }
    
    return new Promise(async (resolve, reject) => {

        let order = {
            IDcustomer: IDcustomer,
            IDorder: IDorder,
            iskaCurrency: rs[0].iskaCurrency,
            sapakName: rs[0].sapakName,
            iskaType: rs[0].iskaType,
            orderStatusDescription: rs[0].orderStatus,
            orderType: rs[0].orderType,
            totalPayment: 0,
            iskaot: [],
            paidTickets:[],
            orderUpsales:[],
            orderCoupon: {
                name:'',
                couponCode:'',
                amount:0,
            },
            orderFeatureOptions:[],
            orderFriendsShareDiscount: {
                name:'',
                amount:0,
            },
        }
        
        rs2 = await GlobalFunction.getFields('orderStatusList','statusDesc',"WHERE IDstatus='"+rs[0].orderStatus+"' AND statusLang='he'")
        if(rs2!='notFound'){ order.orderStatusDescription = rs2[0].statusDesc }

        allsubOrder = _.groupBy(rs, function(ele){ return ele.IDsubOrder  });
        alliskaot = _.groupBy(rs, function(ele){  return ele.ordIDiska   });
        allOrderRecords = rs
    
        let totalQuantity = 0
        let totalCost = 0
        
        let shipmentCost = 0
        await Object.keys(alliskaot).forEachAsync(async (key) => {
         
            let quantity = JSON.parse(alliskaot[key][0].orderTicketsTotal)
            iskaPrice = (quantity[0].cost)
            quantity = quantity[0].quantity
            
        
            let shipmentDetails
            if(order.orderType == 'רכישה קבוצתית'){
                let allOrderShipment = []
                for (let zzz = 0; zzz < alliskaot[key].length; zzz++) {  
                    if(IDcustomer == alliskaot[key][zzz].IDcustomer && !isAdminMode){
                        let orderShipment = alliskaot[key][zzz].orderShipment
                        if(GlobalFunction.IsJsonString(orderShipment)){
                            orderShipment = JSON.parse(orderShipment)
                            shipmentDetails = { name: orderShipment[0].name, cost: orderShipment[0].cost, details: orderShipment[0].details }
                            shipmentCost+= parseFloat(orderShipment[0].cost)
                        }
                    }
                    if(isAdminMode){
                        let orderShipment = alliskaot[key][zzz].orderShipment
                        if(GlobalFunction.IsJsonString(orderShipment)){
                            orderShipment = JSON.parse(orderShipment)
                            allOrderShipment.push({ name: orderShipment[0].name, cost: orderShipment[0].cost, details: orderShipment[0].details })
                            shipmentCost+= parseFloat(orderShipment[0].cost)
                        }
                    }      
                    order.allOrderShipment = allOrderShipment
                }
            }else{
                shipmentDetails = await showShipmentDetails(alliskaot[key][0].IDorder, alliskaot[key][0].IDsubOrder, alliskaot[key][0].ordIDiska)
                for (let zzz = 0; zzz < alliskaot[key].length; zzz++) {  
                    shipmentCost += parseFloat(shipmentDetails.cost)
                }
            }
          
            
            
            featureOptionsDetails = []
            if (GlobalFunction.IsJsonString(alliskaot[key][0].orderFeatureOptionsTotal)) {
                orderFeatureOptionsTotal = JSON.parse(alliskaot[key][0].orderFeatureOptionsTotal)
                for (ii=0; ii<orderFeatureOptionsTotal.length; ii++) {
                    FeatureOptionName = 'אפשרות שנבחרה'
                    rsFO = await GlobalFunction.getFields('featureOptions','foName',"WHERE IDfo='"+orderFeatureOptionsTotal[ii].IDfo+"' LIMIT 1")
                    if(rsFO!='notFound'){ FeatureOptionName = rsFO[0].foName }
                    featureOptionsDetails.push({name:FeatureOptionName, quantity:orderFeatureOptionsTotal[ii].quantity, cost:orderFeatureOptionsTotal[ii].cost})
                }
            }
            // upsalesDetails = []
            // if (GlobalFunction.IsJsonString(alliskaot[key][0].orderUpsales)) {
            //     upsales = JSON.parse(alliskaot[key][0].orderUpsales)
            //     for (ii=0; ii<upsales.length; ii++) {
            //         upsaleName = 'מוצר נלווה'
            //         rsFO = await GlobalFunction.getFields('upSales','upsaleName',"WHERE IDupsale='"+upsales[ii].IDupsale+"' LIMIT 1")
            //         if(rsFO!='notFound'){ upsaleName = rsFO[0].upsaleName }
            //         upsalesDetails.push({name:upsaleName, quantity:upsales[ii].quantity, cost:upsales[ii].cost})
            //     }
            // }

            order.iskaot.push({
                "IDiska":alliskaot[key][0].ordIDiska,
                "IDsubOrder":alliskaot[key][0].IDsubOrder, 
                "iskaName":alliskaot[key][0].iskaName,
                "iskaQuantity": quantity + " יח' ",
                "iskaPrice":iskaPrice,
                "branchAddress":alliskaot[key][0].branchAddress ,
                "orderStatus":alliskaot[key][0].orderStatus,
                "iskaSmallLetters":alliskaot[key][0].iskaSmallLetters,
                "shipmentDetails":shipmentDetails, 
                "featureOptionsDetails":featureOptionsDetails, 
                // "upsalesDetails":upsalesDetails, 
            })
         
        })

        
        // let orderPartsPaid = 0

        Object.keys(allsubOrder).forEach((key , i) => {

            let customerName = allsubOrder[key][0].customerFirstName +' '+ allsubOrder[key][0].customerLastName
            
            if(isAdminMode){
                totalQuantity = allsubOrder[key][0].orderPartsTotal 
            }else{
                if(IDcustomer == allsubOrder[key][0].IDcustomer){
                    totalQuantity = allsubOrder[key][0].orderPartsTotal
                }
            }
            // let customerName = allsubOrder[key][0].customerFirstName +' '+ allsubOrder[key][0].customerLastName
            
            // if(isAdminMode){
            //     totalQuantity+= allsubOrder[key][0].orderPartsPaid  
            // }else{
            //     if(IDcustomer == allsubOrder[key][0].IDcustomer){
            //         totalQuantity+= allsubOrder[key][0].orderPartsPaid
            //     }
            // }
            

            // for (let zz = 0; zz < allsubOrder[key].length; zz++) {
            //     // console.log('--->', customerName, allsubOrder[key][zz].IDsubOrder, allsubOrder[key][zz].orderTicketsPaid, allsubOrder[key][zz].orderPartsPaid, '<-----');
            //     if(GlobalFunction.IsJsonString(allsubOrder[key][zz].orderTicketsPaid)){
            //         let orderTicketsPaid = JSON.parse(allsubOrder[key][zz].orderTicketsPaid)
                    
            //         if(isAdminMode){
            //             totalCost+= parseFloat(orderTicketsPaid[0].cost)
            //         }else{
            //             //console.log(allsubOrder[key]);
            //             if(IDcustomer == allsubOrder[key][zz].IDcustomer){
            //                 totalCost+= parseFloat(orderTicketsPaid[0].cost)
            //             }
            //         }
                    
            //     }
            // }
            for (let zz = 0; zz < allsubOrder[key].length; zz++) {
                // console.log('--->', customerName, allsubOrder[key][zz].IDsubOrder, allsubOrder[key][zz].orderTicketsPaid, allsubOrder[key][zz].orderPartsPaid, '<-----');
                // if(order.orderType == 'רכישה קבוצתית'){
                //     if(GlobalFunction.IsJsonString(allsubOrder[key][zz].orderTicketsPaid)){
                //         let orderTicketsPaid = JSON.parse(allsubOrder[key][zz].orderTicketsPaid)
                        
                //         if(isAdminMode){
                //             totalCost+= parseFloat(orderTicketsPaid[0].cost)
                //         }else{
                //             console.log('IDcustomer == allsubOrder[key][zz].IDcustomer' , IDcustomer , allsubOrder[key][zz].IDcustomer);
                //             if(IDcustomer == allsubOrder[key][zz].IDcustomer){
                //                 totalCost+= parseFloat(orderTicketsPaid[0].cost)
                //             }
                //         }
                        
                //     }
  
                // }else{
                    if(GlobalFunction.IsJsonString(allsubOrder[key][zz].orderTicketsTotal)){
                        let orderTicketsTotal = JSON.parse(allsubOrder[key][zz].orderTicketsTotal)
                        totalCost+= parseFloat(orderTicketsTotal[0].cost)
                        
                        // if(isAdminMode){
                        //     totalCost+= parseFloat(orderTicketsTotal[0].cost)
                        // }else{
                        //     console.log('IDcustomer == allsubOrder[key][zz].IDcustomer' , IDcustomer , allsubOrder[key][zz].IDcustomer);
                        //     if(IDcustomer == allsubOrder[key][zz].IDcustomer){
                        //         totalCost+= parseFloat(orderTicketsTotal[0].cost)
                        //     }
                        // }
                        
                    }
                // }


            }
     
            for (let ttt = 0; ttt < allsubOrder[key][0].orderPartsPaid; ttt++) {
                if(isAdminMode){
                    order.paidTickets.push({ "name":'שולם - ' + customerName  })
                } else {
                    if(allsubOrder[key][0]){
                        if(IDcustomer == allsubOrder[key][0].IDcustomer){
                            order.paidTickets.push({ "name":'שולם - ' + customerName })   
                         }else{
                            order.paidTickets.push({ "name":'שולם - ' + customerName , other:true})   
                        }
                    }
                }
            }
        });
        
        console.log('totalCost' , totalCost , 'totalQuantity' , totalQuantity);
        if(order.orderType != 'רכישה קבוצתית'){
            totalCost += shipmentCost
            shipmentCost = 0
        }
        console.log('totalCost' , totalCost , 'totalQuantity' , totalQuantity);
        
        order.paidTickets.forEach((Tickets , i) => {
            Tickets.cost = (totalCost / totalQuantity).toFixed(2)
            Tickets.payment = 'תשלום ' + (i + 1) 
            // Tickets.payment = 'תשלום ' + (i + 1) 
            if(!Tickets.other) { order.totalPayment += +(Tickets.cost) }
        })
        
        let paidTicketCount = order.paidTickets.length
        let TotalTicketCount = rs[0].orderPartsTotal

        for (let i = paidTicketCount; i < TotalTicketCount; i++) {
            order.paidTickets.push({ "name":'טרם שולם' , "payment":'תשלום ' + (i + 1),  "cost":'0.00' })   
        }

        //}
        // -- אפשרויות למוצר שנבחרו כל אחת בשורה + מחיר --
        
        // await Object.keys(allsubOrder['1']).forEachAsync(async(key) => {
            //     key = parseInt(key)
        //     if(GlobalFunction.IsJsonString(allsubOrder['1'][key].orderFeatureOptionsPaid)) {
        //         oua = JSON.parse(allsubOrder['1'][key].orderFeatureOptionsPaid)
        //         // console.log(i,oua);
        //         if(oua)
        //         await oua.forEachAsync(async(oua) => {
        //             FeatureOptionsName = 'אפשרות'
        //             rs2 = await GlobalFunction.getFields('featureOptions','foName',"WHERE IDfo='"+oua.IDfo+"' LIMIT 1")
        //             if(rs2!='notFound'){ FeatureOptionsName = rs2[0].foName }
        //             order.totalPayment += parseFloat(oua.cost)
        //             if(order.iskaot.length > 1){
        //                 let iskaName = allsubOrder['1'][key].iskaName 
        //                 if(iskaName.length > 15){
        //                     iskaName = iskaName.substring(0,15) + '...'
        //                 }
        //                 FeatureOptionsName += ' - ' + iskaName
        //             }
        //             order.orderFeatureOptions.push({ "IDfo":oua.IDfo , "name":FeatureOptionsName , "quantity":'' , "cost":oua.cost })
        //         })
        //     }
        // })
        
        // -- סיכום אפשרויות למוצר שנבחרו, סכום של כולן יחד בשורה אחת --
        FOcost = 0
        // tmpRStoCheck = allsubOrder['1']
        // if (isAdminMode) { tmpRStoCheck = allOrderRecords }
        tmpRStoCheck = allOrderRecords
        await Object.keys(tmpRStoCheck).forEachAsync(async(key) => {
            key = parseInt(key)
            if(GlobalFunction.IsJsonString(tmpRStoCheck[key].orderFeatureOptionsPaid) && (isAdminMode || tmpRStoCheck[key].IDcustomer==IDcustomer)) {
            //if(GlobalFunction.IsJsonString(tmpRStoCheck[key].orderFeatureOptionsPaid)) {
                oua = JSON.parse(tmpRStoCheck[key].orderFeatureOptionsPaid)
                if(oua) { await oua.forEachAsync(async(oua) => { FOcost += parseFloat(oua.cost) }) }
            }
        })
        if (FOcost!=0) { 
            order.totalPayment += FOcost
            order.orderFeatureOptions.push({ "IDfo":0 , "name":'אפשרויות למוצר' , "quantity":'' , "cost":FOcost.toFixed(2) }) 
        }
        
        upsalesCost = 0
        await allOrderRecords.forEachAsync(async (element) => {

            // --- מוצרים נילווים ---
            console.log(element.orderUpsales, element.IDcustomer)
            if (isAdminMode || IDcustomer==element.IDcustomer) {
                if (GlobalFunction.IsJsonString(element.orderUpsales)) {
                    upsales = JSON.parse(element.orderUpsales)
                    for (ii=0; ii<upsales.length; ii++) {
                        upsaleName = 'מוצר נלווה'
                        rsFO = await GlobalFunction.getFields('upSales','upsaleName',"WHERE IDupsale='"+upsales[ii].IDupsale+"' LIMIT 1")
                        if(rsFO!='notFound'){ upsaleName = rsFO[0].upsaleName }
                        order.orderUpsales.push({name:upsaleName, quantity:upsales[ii].quantity, cost:upsales[ii].cost})
                        upsalesCost += parseFloat(upsales[ii].cost)
                    }
                }
            }

            // --- הנחת קופון אם יש - יוצג בסוף לאחר כל רשימת הכרטיסים ואפשרויות המוצר ---
            if ((element.orderCouponAmount!=0 && isAdminMode) || (element.orderCouponAmount!=0 && IDcustomer == element.IDcustomer)) {
                order.orderCoupon.name = 'הנחת קופון'
                order.orderCoupon.couponCode += (order.orderCoupon.couponCode!='' ? ', ' : '') + element.orderCoupon
                order.orderCoupon.amount -= parseFloat(element.orderCouponAmount)
                // console.log('order.totalPayment = ', order.totalPayment, 'added coupon ', element.orderCouponAmount, 'total coupon discount is ', order.orderCoupon.amount)
            }
            
            // --- הנחת שיתוף חברים ---
            
            if ((element.orderFriendsShareDiscountAmount>0 && isAdminMode) || (element.orderFriendsShareDiscountAmount>0 && IDcustomer == element.IDcustomer)) {
                order.orderFriendsShareDiscount.name = 'הנחת קפטן הפצה'
                order.orderFriendsShareDiscount.amount -= parseFloat(element.orderFriendsShareDiscountAmount)
                console.log('order.totalPayment = ', order.totalPayment, 'added friend discount ', element.orderFriendsShareDiscountAmount, 'total friend discount ', order.orderFriendsShareDiscount.amount)
            }
            
        })
        console.log('shipmentCost => ' , shipmentCost);

        order.totalPayment += upsalesCost
        order.totalPayment += order.orderCoupon.amount
        order.totalPayment += order.orderFriendsShareDiscount.amount
        order.totalPayment += shipmentCost
        order.orderCoupon.amount = (order.orderCoupon.amount).toFixed(2)
        order.orderFriendsShareDiscount.amount = (order.orderFriendsShareDiscount.amount).toFixed(2)
        order.totalPayment = (order.totalPayment).toFixed(2)
        
        


        resolve({pp11toShow:order})

    })
}

async function getAuctionOrder(IDorder, IDcustomer, rs) {
    console.log('IDcustomer --->' , IDcustomer);
    let isAdminMode = false
    if(IDcustomer == 0){
        isAdminMode = true
    }

    console.log(123);
    
    return new Promise(async (resolve, reject) => {

        let order = {
            IDcustomer: IDcustomer,
            IDorder: IDorder,
            iskaCurrency: rs[0].iskaCurrency,
            iskaType: rs[0].iskaType,
            sapakName: rs[0].sapakName,
            orderStatusDescription: rs[0].orderStatus,
            orderType: rs[0].orderType,
            totalPayment: 0,
            iskaot: [],
            paidTickets:[],
            orderUpsales:[],
            orderCoupon: {
                name:'',
                couponCode:'',
                amount:0,
            },
            orderFeatureOptions:[],
            orderFriendsShareDiscount: {
                name:'',
                amount:0,
            },
        }
        
        rs2 = await GlobalFunction.getFields('orderStatusList','statusDesc',"WHERE IDstatus='"+rs[0].orderStatus+"' AND statusLang='he'")
        if(rs2!='notFound'){ order.orderStatusDescription = rs2[0].statusDesc }

        allsubOrder = _.groupBy(rs, function(ele){ return ele.IDsubOrder  });
        alliskaot = _.groupBy(rs, function(ele){  return ele.ordIDiska   });
        allOrderRecords = rs
    
        let totalQuantity = 0
        let totalCost = 0
        
        let shipmentCost = 0
        await Object.keys(alliskaot).forEachAsync(async (key) => {
         
            let customerName = alliskaot[key][0].customerFirstName +' '+ alliskaot[key][0].customerLastName
            // console.log(alliskaot[key]);

            let quantity = JSON.parse(alliskaot[key][0].orderTicketsTotal)
            iskaPrice = (quantity[0].cost)
            quantity = quantity[0].quantity        
            let shipmentDetails
            shipmentDetails = await showShipmentDetails(alliskaot[key][0].IDorder, alliskaot[key][0].IDsubOrder, alliskaot[key][0].ordIDiska)
          
            
            order.iskaot.push({
                "IDiska":alliskaot[key][0].ordIDiska,
                "IDsubOrder":alliskaot[key][0].IDsubOrder, 
                "iskaName":alliskaot[key][0].iskaName,
                "customerName":customerName,
                "orderBidPrice":alliskaot[key][0].orderBidPrice,
                "iskaQuantity": quantity + " יח' ",
                "iskaPrice":iskaPrice,
                "branchAddress":alliskaot[key][0].branchAddress ,
                "orderStatus":alliskaot[key][0].orderStatus,
                "iskaSmallLetters":alliskaot[key][0].iskaSmallLetters,
                "shipmentDetails":shipmentDetails, 
                // "featureOptionsDetails":featureOptionsDetails, 
                // "upsalesDetails":upsalesDetails, 
            })
         
        })

        
        // let orderPartsPaid = 0

        Object.keys(allsubOrder).forEach((key , i) => {

            let customerName = allsubOrder[key][0].customerFirstName +' '+ allsubOrder[key][0].customerLastName
                        
            totalQuantity = allsubOrder[key][0].orderPartsTotal

            let orderTicketsPaid = allsubOrder[key][0].orderTicketsPaid
            if(GlobalFunction.IsJsonString(orderTicketsPaid)){
                orderTicketsPaid = JSON.parse(orderTicketsPaid)
                cost = orderTicketsPaid[0].cost
                totalCost += parseFloat(orderTicketsPaid[0].cost)
                order.paidTickets.push({ "name":'השתתפות במרכז - ' + customerName ,  "cost":cost })           
            }

     
        });
        
    
        
        upsalesCost = 0
        await allOrderRecords.forEachAsync(async (element) => {
            // --- מוצרים נילווים ---
            console.log(element.orderUpsales, element.IDcustomer)
            if (isAdminMode || IDcustomer==element.IDcustomer) {
                if (GlobalFunction.IsJsonString(element.orderUpsales)) {
                    upsales = JSON.parse(element.orderUpsales)
                    for (ii=0; ii<upsales.length; ii++) {
                        upsaleName = 'מוצר נלווה'
                        rsFO = await GlobalFunction.getFields('upSales','upsaleName',"WHERE IDupsale='"+upsales[ii].IDupsale+"' LIMIT 1")
                        if(rsFO!='notFound'){ upsaleName = rsFO[0].upsaleName }
                        order.orderUpsales.push({name:upsaleName, quantity:upsales[ii].quantity, cost:upsales[ii].cost})
                        upsalesCost += parseFloat(upsales[ii].cost)
                    }
                }
            }

            // --- הנחת קופון אם יש - יוצג בסוף לאחר כל רשימת הכרטיסים ואפשרויות המוצר ---
            // if ((element.orderCouponAmount!=0 && isAdminMode) || (element.orderCouponAmount!=0 && IDcustomer == element.IDcustomer)) {
            //     order.orderCoupon.name = 'הנחת קופון'
            //     order.orderCoupon.couponCode += (order.orderCoupon.couponCode!='' ? ', ' : '') + element.orderCoupon
            //     order.orderCoupon.amount -= parseFloat(element.orderCouponAmount)
            //     // console.log('order.totalPayment = ', order.totalPayment, 'added coupon ', element.orderCouponAmount, 'total coupon discount is ', order.orderCoupon.amount)
            // }
            
            // --- הנחת שיתוף חברים ---
            
            if ((element.orderFriendsShareDiscountAmount>0 && isAdminMode) || (element.orderFriendsShareDiscountAmount>0 && IDcustomer == element.IDcustomer)) {
                order.orderFriendsShareDiscount.name = 'הנחת קפטן הפצה'
                order.orderFriendsShareDiscount.amount -= parseFloat(element.orderFriendsShareDiscountAmount)
                console.log('order.totalPayment = ', order.totalPayment, 'added friend discount ', element.orderFriendsShareDiscountAmount, 'total friend discount ', order.orderFriendsShareDiscount.amount)
            }
            
        })
        console.log('shipmentCost => ' , shipmentCost);

        order.totalPayment += totalCost
        // order.totalPayment += order.orderCoupon.amount
        order.totalPayment += order.orderFriendsShareDiscount.amount
        order.orderCoupon.amount = (order.orderCoupon.amount).toFixed(2)
        order.orderFriendsShareDiscount.amount = (order.orderFriendsShareDiscount.amount).toFixed(2)
        order.totalPayment = (order.totalPayment).toFixed(2)
        
        


        resolve({pp11toShow:order})

    })
}

async function getOrderDetails(IDorder) {
    // --- שולפת נתונים ומצב הזמנה להצגה בהתאמה בדף pp11 ---
    // --- אם סטטוס הזמנה לא מתאים לדף 11 תוחזר תשובה מתאימה לאן להעביר את הגולש ---
    // *************************************
    // לממשק אדמין
    // *************************************

    return new Promise(async (resolve, reject) => {
        
        // console.log('IDorder, IDcustomer' , IDorder, IDcustomer)


        Pool.query("SELECT ord.IDorder, ord.IDIska as ordIDiska, ord.IDsubOrder, ord.IDcustomer, ord.IDpayment, ord.orderType, ord.orderStatus, ord.manualOrder, ord.orderFeatureOptionsTotal, ord.timeToCompletePartsPayment, ord.orderTicketsTotal, ord.orderTicketsPaid, ord.orderPartsTotal, ord.orderPartsPaid, ord.IDinlay, ord.orderFeatureOptionsPaid, ord.orderUpsales, ord.orderShipment, ord.IDbranch, ord.orderCoupon, ord.orderCouponAmount, ord.orderBidPrice, ord.orderFriendsShareDiscountAmount, cus.customerFirstName, cus.customerLastName, isk.iskaName, isk.iskaCurrency, isk.iskaTakanon ,isk.iskaTakanonFileName , isk.iskaAboutFileName  , isk.iskaAboutFileNameLink , isk.iskaMaxPayments, isk.IDsapak, isk.iskaType, isk.iskaSmallLetters, inl.inlaySchedule, sp.branchAddress, pay.paymentAmount, sapakim.sapakLogo,sapakim.sapakName FROM orders as ord LEFT JOIN iskaot as isk ON (ord.IDIska=isk.IDiska) LEFT JOIN customers as cus ON (ord.IDcustomer=cus.IDcustomer) LEFT JOIN sapakBranches as sp ON (ord.IDbranch=sp.IDbranch) LEFT JOIN payments as pay ON (ord.IDpayment=pay.IDpayment) LEFT JOIN inlays as inl ON (ord.IDinlay=inl.IDinlay) LEFT JOIN sapakim ON (sapakim.IDsapak=isk.IDsapak)  WHERE ord.IDorder=(?) ORDER BY ord.idx, ord.IDsubOrder",[IDorder], async (err, rs ,fields) => {

            console.log(rs , IDorder);

            if(rs[0].iskaType=='professionals'){
                let res = await getProfessionalsOrder(IDorder, 0, rs)
                resolve(res)
                console.log(res);
            }

            if(rs[0].iskaType=='attraction'){
                let res = await getAttractionOrder(IDorder, 0, rs)
                resolve(res)
                console.log(res);
            }
            
            if(rs[0].iskaType=='product-food'){
                let res = await getProductFoodOrder(IDorder, 0, rs)
                resolve(res)
                // console.log(res);
            }

            if(rs[0].iskaType=='auction'){
                let res = await getAuctionOrder(IDorder, 0, rs)
                resolve(res)
                console.log(res);
            }
   

        })
       
    })
}


const showShipmentDetails = async function(IDorder, IDsubOrder, IDiska){  
    return new Promise(async(resolve, reject) => {
        // --- מחזירה פרטי משלוח ומחיר להצגה בסיכום ההזמנה PP11 ---

        let sName
        let sDetails
        let sCost
        let orderShipment
        if (IDiska) {
            IDiska = " AND IDiska='"+IDiska+"'"
        } else {
            IDiska = ''
        }
        if (IDsubOrder) {
            IDsubOrder = " AND IDsubOrder='"+IDsubOrder+"'"
        } else {
            IDsubOrder = " AND IDsubOrder='1'"
        }
        rsgsd = await GlobalFunction.getFields('orders', 'orderShipment', "WHERE IDorder='"+IDorder+"' "+IDsubOrder+IDiska+" LIMIT 1") 
        // console.log("WHERE IDorder='"+IDorder+"' "+IDsubOrder+IDiska+" LIMIT 1\n" ,rsgsd)  
        console.log(rsgsd);
        if (rsgsd!='notFound') {
            orderShipment = rsgsd[0].orderShipment
            if(GlobalFunction.IsJsonString(orderShipment) && orderShipment!=null){
                orderShipment = JSON.parse(orderShipment)
                sName = orderShipment[0].name
                sDetails = orderShipment[0].details
                sCost = orderShipment[0].cost
            }
        }
        if (sCost!=undefined && sCost!='') { sCost = eval(sCost).toFixed(2) }
        console.log('showShipmentDetails('+IDorder+', '+IDsubOrder+', '+IDiska+') -> ', sName, sCost, sDetails )
        resolve({ name:sName, cost: sCost, details: sDetails })
    })
}

const cancelOrder = async function(IDsapak,IDorder){
    return new Promise(async (resolve, reject) => {
        let IDcustomer = await GlobalFunction.getRandNumber(6 , 'customers' , 'IDcustomer');

        Pool.query('UPDATE orders SET orderStatus = 20 WHERE IDorder = (?)',[IDorder], async(err, row ,fields) => {
            if (err){
                console.log(err);
                return reject(err);
            } 
            resolve({status : 'success' })
        })
    })
}


module.exports ={
    AddManualOrder , getOrderByIDsapak , getAgentsByIDsapak, getReportIskaot, getCustomersByIska, getOrderDetails , getProfessionalsOrder , getProductFoodOrder, getAttractionOrder, getAuctionOrder , showShipmentDetails , cancelOrder
}
