var express = require('express');
var router = express.Router();
var iskaCategoriesHelper = require('./../../helpers/admin/iskaCategoriesHelper');



router.post('/getAllCategory', async function(req, res, next) {
    let iskaType = req.body.iskaType
    let validRes = await iskaCategoriesHelper.getAllCategory(iskaType);
    res.send(validRes)  
});

module.exports = router; 