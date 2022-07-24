var express = require('express');
var router = express.Router();
var upSales = require('./../../helpers/admin/upSalesHelper');



router.post('/getAllUpSalesByIdSapak', async function(req, res, next) {
    let IDsapak = req.IDsapak    
    let resUpSale = await upSales.getAllUpSalesByIdSapak(IDsapak)
    res.send(resUpSale)
});


router.post('/addUpSale', async function(req, res, next) {
    let IDsapak = req.IDsapak    
    let upSale = req.body.upSale    
    let resUpSale = await upSales.addUpSale(IDsapak,upSale)
    res.send(resUpSale)
});

router.post('/editUpSale', async function(req, res, next) {
    let IDsapak = req.IDsapak    
    let upSale = req.body.upSale    
    let resUpSale = await upSales.editUpSale(IDsapak,upSale)
    res.send(resUpSale)
});

router.post('/deleteUpSale', async function(req, res, next) {
    let IDsapak = req.IDsapak    
    let IDupsale = req.body.IDupsale    
    let resUpSale = await upSales.deleteUpSale(IDsapak,IDupsale)
    res.send(resUpSale)
});

module.exports = router; 