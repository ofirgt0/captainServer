const express = require('express');
const router = express.Router();
const iskaotHelper = require('./../../helpers/site/iskaotHelper');
const GlobalFunction = require('./../../helpers/admin/GlobalFunction')

const UserAuth = require("./../../core/authentication/UserAuth");





/******************************************
 *********** Router
 ******************************************/

router.post('/getRoute', async function(req, res, next) {
    let routeCode = req.body.routeCode
    let IskaDetailsRes = await GlobalFunction.getRoute(routeCode)
    res.send(IskaDetailsRes)
});


router.post('/setRoute', async function(req, res, next) {
    let routeURL = req.body.routeURL
    let IskaDetailsRes = await GlobalFunction.setRoute(routeURL)
    res.send(IskaDetailsRes)
});

/******************************************
 *********** Router
 ******************************************/

router.post('/getIDorder', async function(req, res, next) {
    let IDorder = await GlobalFunction.getRandNumber(6,'orders','IDorder')
    res.send({status : 'success' , IDorder:IDorder })
});

router.post('/AddOrder', UserAuth ,async function(req, res, next) {
    // let IDcustomer = req.IDcustomer
    // if(IDcustomer == 0){
    //     res.send({status:'Not authorized'})
    //     return
    // }

    let myCart = req.body.myCart
    let pLang = 'he'
    let IskaDetailsRes = await iskaotHelper.AddOrder(myCart,req.ip,pLang,req.IDcustomer,req.Pickup)
    res.send(IskaDetailsRes)
})

router.post('/getLastIska', async function(req, res, next) {
    let IDiska = req.body.IDiska
    let IDinlay = req.body.IDinlay
    let IskaDetailsRes = await iskaotHelper.getLastIska(IDiska,IDinlay)
    res.send(IskaDetailsRes)
});

router.post('/getIskaDetails', async function(req, res, next) {
    // להוסיף כאן תנאי להביא מידע פר עסקה
    // let iskaType = await GlobalFunction.getFields('iskaot' , 'iskaType' , "WHERE IDiska = '"+IDiska+"'")
    
    let IDiska = req.body.IDiska
    let IDinlay = req.body.IDinlay
    let cartProductsExis = req.body.cartProductsExis

    let HeaderDetails = await iskaotHelper.getIskaHeaderDetails(IDiska,IDinlay)
    let footerDetails = await iskaotHelper.getIskaFooterDetails(IDiska)
    let getQuantityDiscount = await iskaotHelper.getQuantityDiscount(IDiska)
    let getAllinlayByIdIskaAndIDinlay = await iskaotHelper.getAllinlayByIdIskaAndIDinlay(IDiska,IDinlay)
    let featureOptions = await iskaotHelper.getFeatureOptions(IDiska)
    let moreIskaot = await iskaotHelper.getMoreIskaot(IDiska,cartProductsExis)
    let TicketTypes = await iskaotHelper.getTicketTypes(IDiska)

    res.send({HeaderDetails,footerDetails,featureOptions,getQuantityDiscount,moreIskaot,getAllinlayByIdIskaAndIDinlay,TicketTypes}) 
});



router.post('/getIskaHeaderDetails', async function(req, res, next) {
    let IDiska = req.body.IDiska
    let IDinlay = req.body.IDinlay
    let IskaDetailsRes = await iskaotHelper.getIskaHeaderDetails(IDiska,IDinlay)
    res.send(IskaDetailsRes) 
});


router.post('/getFeatureOptions', async function(req, res, next) {
    let IDiska = req.body.IDiska
    let IskaDetailsRes = await iskaotHelper.getFeatureOptions(IDiska)
    res.send(IskaDetailsRes)
});

router.post('/GetFeatureOptionsGroupByIDiska', async function(req, res, next) {
    let AllIDiska = req.body.AllIDiska
    let IskaDetailsRes = await iskaotHelper.GetFeatureOptionsGroupByIDiska(AllIDiska)
    res.send(IskaDetailsRes)
});

router.post('/getMoreIskaot', async function(req, res, next) {
    let IDiska = req.body.IDiska
    let IskaDetailsRes = await iskaotHelper.getMoreIskaot(IDiska)
    res.send(IskaDetailsRes)
});


router.post('/getIskaFooterDetails', async function(req, res, next) {
    let IDiska = req.body.IDiska
    let IDsapak = req.body.IDsapak
    let IskaDetailsRes = await iskaotHelper.getIskaFooterDetails(IDiska,IDsapak)
    res.send(IskaDetailsRes)
});

router.post('/getDeliveryDetails', async function(req, res, next) {
    let allIDiska = req.body.allIDiska
    let IskaDetailsRes = await iskaotHelper.getDeliveryDetails(allIDiska)
    res.send(IskaDetailsRes)
});

router.post('/getValidShippingAddress', async function(req, res, next) {
    let IDiska = req.body.IDiska
    let orderShipmentCity = req.body.orderShipmentCity
    let IskaDetailsRes = await iskaotHelper.getValidShippingAddress(IDiska,orderShipmentCity)
    res.send(IskaDetailsRes)
});

router.post('/SendUserVerificationCode', async function(req, res, next) {
    let Pickup = req.body.Pickup
    let IskaDetailsRes = await iskaotHelper.SendUserVerificationCode(Pickup)
    res.send(IskaDetailsRes)
});

router.post('/UserVerificationCode', async function(req, res, next) {
    let Pickup = req.body.Pickup
    let IskaDetailsRes = await iskaotHelper.UserVerificationCode(Pickup)
    res.send(IskaDetailsRes)
});

// router.post('/getMinimumForOrder', async function(req, res, next) {
//     let IDiska = req.body.IDiska
//     let IDinlay = req.body.IDinlay
//     let IskaDetailsRes = await GlobalFunction.getMinimumForOrder(IDiska,IDinlay)
//     res.send(IskaDetailsRes)
// });
 
router.post('/validateCouponViaServer', async function(req, res, next) {
    let IDiska = req.body.IDiska
    let orderCoupon = req.body.orderCoupon
    let IskaDetailsRes = await iskaotHelper.validateCouponViaServer(IDiska,orderCoupon)
    res.send(IskaDetailsRes)
});
 
router.post('/getAllUpSaleByIDiska', async function(req, res, next) {
    let allIDiska = req.body.allIDiska
    let IskaDetailsRes = await iskaotHelper.getAllUpSaleByIDiska(allIDiska)
    res.send(IskaDetailsRes)
});

router.post('/getAllinlayByIdIskaAndIDinlay', async function(req, res, next) {
    let IDiska = req.body.IDiska
    let IDinlay = req.body.IDinlay
    let IskaDetailsRes = await iskaotHelper.getAllinlayByIdIskaAndIDinlay(IDiska,IDinlay)
    res.send(IskaDetailsRes)
});

router.post('/getInlayMaxAndMinAvailableTickets', async function(req, res, next) {
    let IDinlay = req.body.IDinlay
    let maximumTicketsPerRound = await GlobalFunction.getInlayMaxAvailableTickets(IDinlay)
    let minimumTicketsPerOrder = await GlobalFunction.getMinimumForOrder(IDinlay)
    res.send({minimumTicketsPerOrder:minimumTicketsPerOrder , maximumTicketsPerRound:maximumTicketsPerRound})
});
 


router.post('/getOrderDetailsForPP10', async function(req, res, next) {
    let IDorder = req.body.IDorder
    let IDcustomer = req.body.IDcustomer
    let IskaDetailsRes = await iskaotHelper.getOrderDetailsForPP10(IDorder,IDcustomer)
    res.send(IskaDetailsRes)
});

router.post('/getOrderDetailsForPP11', async function(req, res, next) {
    let IDorder = req.body.IDorder
    let IDcustomer = req.body.IDcustomer
    let IskaDetailsRes = await iskaotHelper.getOrderDetailsForPP11(IDorder, IDcustomer)
    res.send(IskaDetailsRes)
});
 
router.post('/DeleteTickets', async function(req, res, next) {
    let Tickets = req.body.Tickets
    let IDorder = req.body.IDorder
    let IskaDetailsRes = await iskaotHelper.DeleteTickets(IDorder,Tickets)
    res.send(IskaDetailsRes)
});
 
router.post('/getHallsMatrix', async function(req, res, next) {
    let IDiska = req.body.IDiska
    let IDinlay = req.body.IDinlay
    let IDhall = req.body.IDhall
    let IskaDetailsRes = await GlobalFunction.getHallsMatrixGlobal(IDiska , IDinlay , IDhall);
    res.send(IskaDetailsRes)
});

router.post('/saveTempChairs', async function(req, res, next) {
    let TempChair = req.body.TempChair
    let IskaDetailsRes = await iskaotHelper.saveTempChairs(TempChair)
    res.send(IskaDetailsRes)
});

router.post('/deleteTempChairs', async function(req, res, next) {
    let TempChair = req.body.TempChair
    let IskaDetailsRes = await iskaotHelper.deleteTempChairs(TempChair)
    res.send(IskaDetailsRes)
});



router.post('/getAllExtrasFood', async function(req, res, next) {
    let IDiska = req.body.IDiska
    let IskaDetailsRes = await iskaotHelper.getAllExtrasFood(IDiska)
    res.send(IskaDetailsRes)
});

router.post('/getChairsSelectedByIdiskaAndIDinlay', async function(req, res, next) {
    let IDiska = req.body.IDiska
    let IDinlay = req.body.IDinlay
    let chairsSelected = req.body.chairsSelected
    let IskaDetailsRes = await iskaotHelper.getChairsSelectedByIdiskaAndIDinlay(IDiska,IDinlay,chairsSelected)
    res.send(IskaDetailsRes)
});







// LocalStorge in Server

router.post('/SaveIskaFromLocalStorge', async function(req, res, next) {
    let data = req.body.data
    let uuid = req.body.uuid
    //console.log('data' , data);
    let IskaDetailsRes = await iskaotHelper.SaveIskaFromLocalStorge(data,uuid)
    res.send(IskaDetailsRes)
});
router.post('/DeleteIskaFromLocalStorge', async function(req, res, next) {
    let uuid = req.body.uuid
    let IskaDetailsRes = await iskaotHelper.DeleteIskaFromLocalStorge(uuid)
    res.send(IskaDetailsRes)
});
router.post('/loadIskaFromLocalStorge', async function(req, res, next) {
    let uuid = req.body.uuid
    let IskaDetailsRes = await iskaotHelper.loadIskaFromLocalStorge(uuid)
    res.send(IskaDetailsRes)
});
 





module.exports = router; 