const hallsHelper = require('./../../helpers/admin/hallsHelper');


var express = require('express');
var router = express.Router();




router.post('/saveHallStructure', async function(req, res, next) {
    let IDsapak = req.IDsapak
    let hallStructure = req.body.hallStructure
    let validRes = await hallsHelper.saveHallStructure(IDsapak,hallStructure);
    res.send(validRes)  
});

router.post('/getAllHallByIdSapak', async function(req, res, next) {
    let IDsapak = req.IDsapak
    let validRes = await hallsHelper.getAllHallByIdSapak(IDsapak);
    res.send(validRes)  
});


router.post('/getSeatCounter', async function(req, res, next) {
    let IDsapak = req.IDsapak
    let IDhall = req.body.IDhall
    let validRes = await hallsHelper.getSeatCounter(IDsapak,IDhall);
    res.send(validRes)  
});

module.exports = router; 