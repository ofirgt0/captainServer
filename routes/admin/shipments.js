var express = require('express');
var router = express.Router();
var shipments = require('./../../helpers/admin/shipmentsHelper');


router.post('/getAllShipments', async function(req, res, next) {
    let IDsapak = req.IDsapak
    let shipmentsRes = await shipments.getAllShipments(IDsapak)
    res.send(shipmentsRes)

});


router.post('/addShipment', async function(req, res, next) {
    let IDsapak = req.IDsapak
    let shipment = req.body.shipment
    let shipmentsRes = await shipments.addShipment(IDsapak , shipment)
    res.send(shipmentsRes)

});

module.exports = router; 