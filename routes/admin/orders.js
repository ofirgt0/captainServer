var express = require('express');
var router = express.Router();
var ordersHelper = require('./../../helpers/admin/ordersHelper');



router.post('/AddManualOrder', async function(req, res, next) {
    let IDsapak = req.IDsapak
    let IDiska = req.body.IDiska
    let Order = req.body.Order
    let validRes = await ordersHelper.AddManualOrder(IDsapak,IDiska,Order);
    res.send(validRes)  
});

router.post('/getOrderDetails', async function(req, res, next) {
    let IDsapak = req.IDsapak
    let IDorder = req.body.IDorder
    let validRes = await ordersHelper.getOrderDetails(IDorder);
    res.send(validRes)  
});

router.post('/getOrderByIDsapak', async function(req, res, next) {
    let IDsapak = req.IDsapak
    let dateStart = req.body.dateStart
    let dateEnd = req.body.dateEnd
    let validRes = await ordersHelper.getOrderByIDsapak(IDsapak,dateStart,dateEnd);
    res.send(validRes)  
});

router.post('/getAgentsByIDsapak', async function(req, res, next) {
    let IDsapak = req.IDsapak
    let dateStart = req.body.dateStart
    let dateEnd = req.body.dateEnd
    let validRes = await ordersHelper.getAgentsByIDsapak(IDsapak,dateStart,dateEnd);
    res.send(validRes)  
});

router.post('/getReportIskaot', async function(req, res, next) {
    let IDsapak = req.IDsapak;
    let dateStartInlay = req.body.dateStartInlay;
    let dateEndInlay = req.body.dateEndInlay;
    let NoFilterInlay = !dateStartInlay && !dateEndInlay;
    let dateStartCreactionDate = req.body.dateStartCreactionDate;
    let dateEndCreationDate = req.body.dateEndCreationDate;
    let isActive = req.body.isActive;
    let noFilterIsActive = !(req.body.isActive === true || req.body.isActive === false) ;
    let iskaType = req.body.iskaType;
    // console.log("dateEndCreationDatesdfsdfd",dateEndCreationDate)
    let validRes = await ordersHelper.getReportIskaot(IDsapak,dateStartInlay, dateEndInlay, NoFilterInlay, dateStartCreactionDate, dateEndCreationDate,isActive, noFilterIsActive, iskaType);
    res.send(validRes)  
});

router.post('/getCustomersByIska', async function(req, res, next) {
    let IDsapak = req.IDsapak;
    let IDiska = req.body.IDiska;

    let validRes = await ordersHelper.getCustomersByIska(IDsapak,IDiska);
    res.send(validRes)  
});


router.post('/cancelOrder', async function(req, res, next) {
    let IDsapak = req.IDsapak
    let IDorder = req.body.IDorder
    let validRes = await ordersHelper.cancelOrder(IDsapak,IDorder);
    res.send(validRes)  
});



module.exports = router; 