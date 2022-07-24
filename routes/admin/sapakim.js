var express = require('express');
var router = express.Router();
var sapakimHelper = require('./../../helpers/admin/sapakimHelper');
var sapakBranchesHelper = require('./../../helpers/admin/sapakBranchesHelper');



router.post('/checkAddSapakStep', async function(req, res, next) {
    let IDsapak = req.IDsapak
    let AddSapakStepRes = await sapakimHelper.checkAddSapakStep(IDsapak)
    res.send(AddSapakStepRes)

});

router.post('/getSapakDetails', async function(req, res, next) {
    let IDsapak = req.IDsapak
    let AddSapakStepRes = await sapakimHelper.getSapakDetails(IDsapak)
    res.send(AddSapakStepRes)
});

router.post('/getSapakStatus', async function(req, res, next) {
    let IDsapak = req.IDsapak
    let AddSapakStepRes = await sapakimHelper.getSapakStatus(IDsapak)
    res.send(AddSapakStepRes)
});

router.post('/getAllSapakimList', async function(req, res, next) {
    let IDsapak = req.IDsapak
    let AddSapakStepRes = await sapakimHelper.getAllSapakimList()
    res.send(AddSapakStepRes)
});

router.post('/logisAs', async function(req, res, next) {
    let IDsapak = req.IDsapak
    let loginAsIDsapak = req.body.loginAsIDsapak

    let AddSapakStepRes = await sapakimHelper.logisAs(IDsapak,loginAsIDsapak)
    res.send(AddSapakStepRes)
});

router.post('/editSapak', async function(req, res, next) {
    let IDsapak = req.IDsapak
    let branchs = req.body.addsapak.branchs
    let addsapak = req.body.addsapak
    let sapakBranchesHelperRes = await sapakBranchesHelper.editBranchs(IDsapak , branchs)
    if(sapakBranchesHelperRes.status == 'success'){
        let sapakimHelperRes = await sapakimHelper.editSapak(IDsapak , addsapak)
        res.send(sapakimHelperRes)

    }else{
        console.log('editSapak -> sapakBranchesHelperRes',sapakBranchesHelperRes);
        res.send(sapakBranchesHelperRes)

    }
    return

});

router.post('/payAndCreateSapak', async function(req, res, next) {
    let userPhone = req.userPhone    
    let userName = req.body.userName
    let payment = req.body.payment
    let shouldPay = req.body.shouldPay
    let ipAddress = req.headers['x-forwarded-for'] || req.ip
    let IDsapak = req.IDsapak


    let sapakRes
    // עדכון תשלום
    if(IDsapak){
        sapakRes = await sapakimHelper.UpdateSapakPayment(IDsapak,payment,ipAddress, shouldPay)
    }else{
        sapakRes = await sapakimHelper.payAndCreateSapak(userPhone,userName,payment,ipAddress, shouldPay)
    }
    res.send(sapakRes)
    // return
    // יצירת ספק חדש
    // console.log(sapakRes);

})


// router.post('/pay', async function(req, res, next) {
//     let userPhone = req.userPhone    
//     let userName = req.body.userName
//     let payment = req.body.payment

    

    
    
    
//     // res.send(paymentRes)

// });

module.exports = router; 