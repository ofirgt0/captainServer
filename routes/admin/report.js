var express = require('express');
var router = express.Router();
const reportHelper = require('./../../helpers/admin/reportHelper');

router.post('/', async function(req, res, next) {
    console.log("router post report");
    console.log("reqreports",req.body.param);
    // rep='';
    const rep = await reportHelper.getReport(req.body.param);
    res.send(rep)
});

module.exports = router; 