var express = require('express');
var router = express.Router();
var formidable = require('formidable');
var jwt = require('jsonwebtoken');
var UserHelper = require('./../../helpers/admin/UserHelper');
const globalFunction = require('./../../helpers/admin/GlobalFunction')
const auth = require("./../../core/authentication/auth");
path = require('path');  

/* GET users listing. */
router.post('/login', async function(req, res, next) {
  loginForm = req.body.loginForm
  let validRes = await UserHelper.checkLoginForm(loginForm)
  console.log(validRes);
  res.send(validRes)
  
}); 


router.post('/SendVerificationCode', async function(req, res, next) {
  let mobileCode = req.body.mobileCode.mobileCode
  let userPhone = req.body.loginForm.userPhone
  let userName = req.body.loginForm.userName

  let Token = await globalFunction.checkToken(req.header('Authorization'))

  let validRes = await UserHelper.VerificationCode(mobileCode , userPhone ,userName , Token);

  res.send(validRes)  
});

router.post('/getAllCity', async function(req, res, next) {
  lang = req.body.lang
  let validRes = await globalFunction.getAllCity(lang);
  res.send(validRes)  
});


router.post('/refreshTokan', auth , async function(req, res, next) {
  let IDsapak = req.IDsapak
  let decoded = req.decoded
  let validRes = await UserHelper.refreshTokan(IDsapak,decoded);
  res.send(validRes)  
});
 

router.post('/saveBusinessToServer', auth , async function(req, res, next) {
  let addBusiness = req.body.addBusiness
  let userPhone = req.userPhone
  let validRes = await UserHelper.saveBusinessToServer(addBusiness , userPhone);
  res.send(validRes)  
});

router.post('/getSapakLogoAndSapakName', auth , async function(req, res, next) {
  let IDsapak = req.IDsapak
  let validRes = await UserHelper.getSapakLogoAndSapakName(IDsapak);
  // res.cookie('token', validRes.Token , { httpOnly: true , maxAge:'2000000' })
  res.send(validRes)  
});


router.post('/getTokenForDemoMode' , async function(req, res, next) {
  let Token = await globalFunction.checkToken(req.header('Authorization'))
  // if(Token){
  //   res.send({status:'notNeed'})  
  //   return
  // }

  let validRes = await UserHelper.getTokenForDemoMode();
  res.send(validRes)  
});


router.post('/getUsersWithIncompletedRegistration' ,auth, async function(req, res, next) {
  let validRes = await UserHelper.getUsersWithIncompletedRegistration(req.body.fromDate,req.body.toDate);
  res.send(validRes)  
});

// router.post('/SendVerificationCode', async function(req, res, next) {
//   // מצב של משתמש דמו הוצאת טוקן
//   console.log(11111111111111111111111111111);

//   mobileCode = req.body.mobileCode.mobileCode
//   userPhone = req.body.loginForm.userPhone
//   let validRes = await UserHelper.VerificationCode(mobileCode , userPhone);



//   if(validRes.status = 'err'){
//     res.send(validRes)
//     return
//   }

//   let TokenArray = req.header('Authorization')
//   if(TokenArray){
//     TokenArray = TokenArray.split(" ");
//     let Token = TokenArray[1]

//     jwt.verify(Token, process.env.JWT_SECRET, function(err, decoded) {
//       if (err) {
//         console.log('טוקן שגוי');
//         req.IDsapak = null
//       }
//       // if(decoded){console.log(decoded);}
//       req.IDsapak = decoded.IDsapak
//     });    
//   }

//   console.log(req.IDsapak , validRes.status);
//   if(!req.IDsapak && validRes.status != 'err'){
//     // מצב התחברות רגילה
//     res.send(validRes) 
//     res.end()
//     return
//   }
  
//   console.log(1111111111111111111111111111);
//   // מצב התחברות במצב דמו והפיכת ספק לפעיל
//   if(req.IDsapak){
//     let userPermission = await globalFunction.getFields('adminUsers','userPermission','where IDsapak = ' + req.IDsapak)
//     if(userPermission != 'notFound'){
//         userPermission = userPermission[0].userPermission
//         if(userPermission == 'sapak-demo'){
          
//           validRes = await UserHelper.updateSapakDemoToSapakIskoat(IDsapak,userPhone)
//           console.log('----------------->' , validRes);
//           return

//           res.send(validRes) 
//           res.end()
//           return

//         }
//     }
//   }
   
// });


module.exports = router;
