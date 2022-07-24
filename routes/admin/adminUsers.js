var express = require('express');
var router = express.Router();
var adminUsersHelper = require('./../../helpers/admin/adminUsersHelper');


router.post('/getAllAdminUserByIdSapak', async function(req, res, next) {
    let IDsapak = req.IDsapak
    let adminUsersHelperRes = await adminUsersHelper.getAllAdminUserByIdSapak(IDsapak)
    res.send(adminUsersHelperRes)
});

router.post('/getUserDetailsByIdSapak', async function(req, res, next) {
    let IDsapak = req.IDsapak
    let IDuser = req.body.IDuser
    let adminUsersHelperRes = await adminUsersHelper.getUserDetailsByIdSapak(IDsapak,IDuser)
    res.send(adminUsersHelperRes)
});
router.post('/saveUser', async function(req, res, next) {
    let IDsapak = req.IDsapak
    let UserDetails = req.body.UserDetails
    let adminUsersHelperRes = await adminUsersHelper.saveUser(IDsapak,UserDetails)
    res.send(adminUsersHelperRes)
});
router.post('/deleteUser', async function(req, res, next) {
    let IDsapak = req.IDsapak
    let IDuser = req.body.IDuser
    let adminUsersHelperRes = await adminUsersHelper.deleteUser(IDsapak,IDuser)
    res.send(adminUsersHelperRes)
});

module.exports = router; 