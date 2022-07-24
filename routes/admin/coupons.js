var express = require('express');
const couponsHelper = require('./../../helpers/admin/couponsHelper');


var router = express.Router();



router.post('/getAllCouponsByIDiska', async function(req, res, next) {
  let IDiska = req.body.IDiska
  let validRes = await couponsHelper.getAllCouponsByIDiska(IDiska)
  res.send(validRes)  

});

router.post('/addCouponToIska', async function(req, res, next) {
  let IDsapak = req.IDsapak
  let Coupon = req.body.Coupon
  let validRes = await couponsHelper.addCouponToIska(IDsapak,Coupon)
  res.send(validRes)  
});

router.post('/deleteCoupon', async function(req, res, next) {
  let IDcoupon = req.body.IDcoupon
  let validRes = await couponsHelper.deleteCoupon(IDcoupon)
  res.send(validRes)  

});

router.post('/deleteCouponByGroup', async function(req, res, next) {
  let AllIDcoupon = req.body.AllIDcoupon
  let validRes = await couponsHelper.deleteCouponByGroup(AllIDcoupon)
  res.send(validRes)  

});


module.exports = router; 
