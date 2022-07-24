var jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
// console.log('req.heade' , req.header('Authorization'));
  let TokenArray = req.header('Authorization')
  // TokenArray = ""
  // console.log('TokenArray' ,!TokenArray[1]);
  // res.next()
// console.log(TokenArray);
  if(!TokenArray){
    res.send({status:'Not authorized'})
    return
  }
  TokenArray = TokenArray.split(" ");
  if(!TokenArray[1]){
    res.send({status:'Not authorized'})
    return
  }

  let token = TokenArray[1]
  jwt.verify(token, process.env.JWT_SECRET, function(err, decoded) {
    if (err) {
      // const err = new Error("Not authorized!");
      // err.status = 400;
      // return next(err);
      res.send({status:'Not authorized'})
      return
    }
    // if(decoded){console.log(decoded);}
    req.IDsapak = decoded.IDsapak
    req.userPhone = decoded.userPhone
    req.IDcustomer = decoded.IDcustomer
    return next();
  });
};