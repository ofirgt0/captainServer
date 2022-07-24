var express = require('express');
var router = express.Router();


var featureGroups = require('./../../helpers/admin/featureGroupsHelper');


router.post('/getAllDefaultfeatureGroups', async function(req, res, next) {
    let IDsapak = req.IDsapak
    let featureGroupsRes = await featureGroups.getAllDefaultfeatureGroups(IDsapak)
    res.send(featureGroupsRes)
});

router.post('/AddFeature', async function(req, res, next) {
    let IDsapak = req.IDsapak
    let Feature = req.body.Feature
    let featureGroupsRes = await featureGroups.AddFeature(IDsapak,Feature)
    res.send(featureGroupsRes)
});

router.post('/deleteFeature', async function(req, res, next) {
    let IDsapak = req.IDsapak
    let IDfg = req.body.IDfg
    let featureGroupsRes = await featureGroups.deleteFeature(IDsapak,IDfg)
    res.send(featureGroupsRes)
});

router.post('/getAllfeatureGroupsbyIDsapak', async function(req, res, next) {
    let IDsapak = req.IDsapak
    let IDiska = req.body.IDiska
    let featureGroupsRes = await featureGroups.getAllfeatureGroupsbyIDsapak(IDiska,IDsapak)
    res.send(featureGroupsRes)
});



module.exports = router; 