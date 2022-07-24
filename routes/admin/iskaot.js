var express = require('express');
var router = express.Router();
var iskaotHelper = require('./../../helpers/admin/iskaotHelper');


router.post('/addiska', async function(req, res, next) {
    let iska = req.body.addiska
    let IDsapak = req.IDsapak
    let pLang = req.body.pLang
    let validRes = await iskaotHelper.addIska(IDsapak,iska,pLang);
    res.send(validRes)  
});

router.post('/getAlliskaot', async function(req, res, next) {
    let IDsapak = req.IDsapak
    let validRes = await iskaotHelper.getAlliskaot(IDsapak);
    res.send(validRes)  
});

router.post('/editIska', async function(req, res, next) {
    let IDsapak = req.IDsapak
    let addiska = req.body.addiska
    let validRes = await iskaotHelper.editIska(IDsapak , addiska);
    res.send(validRes)  
});

router.post('/deleteIska', async function(req, res, next) {
    let IDsapak = req.IDsapak
    let IDiska = req.body.IDiska
    let validRes = await iskaotHelper.deleteIska(IDsapak , IDiska);
    res.send(validRes)  
});

router.post('/changeIskaActive', async function(req, res, next) {
    let IDsapak = req.IDsapak
    let IDiska = req.body.IDiska
    let isActive = req.body.isActive
    let validRes = await iskaotHelper.changeIskaActive(IDsapak,IDiska,isActive);
    res.send(validRes)  
});

router.post('/duplicationIska', async function(req, res, next) {
    let IDsapak = req.IDsapak
    let IDiska = req.body.IDiska
    let validRes = await iskaotHelper.duplicationIska(IDsapak,IDiska);
    res.send(validRes)  
});

router.post('/getIskaByIDiska', async function(req, res, next) {
    let IDsapak = req.IDsapak
    let IDiska = req.body.IDiska
    let validRes = await iskaotHelper.getIskaByIDiska(IDsapak,IDiska);
    res.send(validRes)  
});

router.post('/grantIDiska', async function(req, res, next) {
    let digits = req.body.digits
    let tableName = req.body.tableName
    let fieldName = req.body.fieldName
    let validRes = await iskaotHelper.grantIDiska(digits , tableName , fieldName);
    res.send(validRes)  
});

module.exports = router; 