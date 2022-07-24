var express = require('express');
var router = express.Router();
var featureOptionsPerIska = require('./../../helpers/admin/featureOptionsPerIskaHelper');


router.post('/SaveFeatureOptionsToiska', async function(req, res, next) {
    let IDsapak = req.IDsapak
    let IDiska = req.body.IDiska
    let IDfg = req.body.IDfg
    let SelectedFeatureOptionsPerIska = req.body.SelectedFeatureOptionsPerIska 
    let featureOptionsPerIskaRes = await featureOptionsPerIska.SaveFeatureOptionsToiska(IDsapak,IDiska,IDfg,SelectedFeatureOptionsPerIska)
    res.send(featureOptionsPerIskaRes)
});



module.exports = router; 