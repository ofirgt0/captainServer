var jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
// console.log('req.heade' , req.header('Authorization'));
  let TokenArray = req.header('AuthorizationUser')
  // console.log(TokenArray);
  // TokenArray = ""
  // console.log('TokenArray' ,!TokenArray[1]);
  // res.next()
// console.log(TokenArray);
  if(!TokenArray){
    res.send({status:'Not authorized user'})
    return
  }
  TokenArray = TokenArray.split(" ");
  if(!TokenArray[1]){
    res.send({status:'Not authorized user'})
    return
  }

  let token = TokenArray[1]
  jwt.verify(token, process.env.JWT_SECRET, function(err, decoded) {
    if (err) {
      res.send({status:'Not authorized user'})
      return
    }else{
      req.IDcustomer = decoded.IDcustomer
      req.Pickup = decoded.Pickup
    }
    // if(decoded){console.log(decoded);}
    return next();
  });
};