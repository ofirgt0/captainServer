var express = require('express');
var router = express.Router();
var featureOptions = require('./../../helpers/admin/featureOptionsHelper');



router.post('/getAllfeatureOptionsByIDfg', async function(req, res, next) {
    let IDiska = req.body.IDiska 
    let IDfg = req.body.IDfg 
    let featureOptionsRes = await featureOptions.getAllfeatureOptionsByIDfg(IDiska,IDfg)
    res.send(featureOptionsRes)
});


router.post('/addFeatureOptions', async function(req, res, next) {
    let IDsapak = req.IDsapak
    let IDfg = req.body.IDfg 
    let foName = req.body.foName 
    let featureOptionsRes = await featureOptions.addFeatureOptions(IDsapak,IDfg,foName)
    res.send(featureOptionsRes)
});


router.post('/getFoodIngredients', async function(req, res, next) {
    let IDsapak = req.IDsapak
    let IDiska = req.body.IDiska
    let featureOptionsRes = await featureOptions.getFoodIngredients(IDiska,IDsapak)
    res.send(featureOptionsRes)
});

router.post('/AddFoodIngredients', async function(req, res, next) {
    let IDsapak = req.IDsapak
    let FoodOneIngredients = req.body.FoodOneIngredients
    let featureOptionsRes = await featureOptions.AddFoodIngredients(IDsapak,FoodOneIngredients)
    res.send(featureOptionsRes)
});


router.post('/saveFoodIngredientsForIska', async function(req, res, next) {
    let IDsapak = req.IDsapak
    let IDiska = req.body.IDiska
    let FoodIngredients = req.body.FoodIngredients
    let featureOptionsRes = await featureOptions.saveFoodIngredientsForIska(IDsapak,IDiska,FoodIngredients)
    res.send(featureOptionsRes)
});



// router.post('/gatAllfeatureGroupsByIDfg', async function(req, res, next) {
//     let IDsapak = req.IDsapak 
//     let IDfg = req.body.IDfg 
//     let featureOptionsRes = await featureOptions.gatAllfeatureGroupsByIDfg(IDsapak,IDfg)
//     res.send(featureOptionsRes)
// });

 

// router.post('/addFeatureGroupsToiska', async function(req, res, next) {
//     let IDsapak = req.IDsapak 
//     let IDfg = req.body.IDfg 
//     let featureOptionsRes = await featureOptions.addFeatureGroupsToiska(IDsapak,IDfg)
//     res.send(featureOptionsRes)
// });


// router.post('/addFeatureGroupsToiska', async function(req, res, next) {
//     let IDsapak = req.IDsapak 
//     let IDfg = req.body.IDfg 
//     let featureOptionsRes = await featureOptions.addFeatureGroupsToiska(IDsapak,IDfg)
//     res.send(featureOptionsRes)
// });


module.exports = router; 