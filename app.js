var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
const bodyParser = require("body-parser");
var logger = require('morgan');
var cors = require('cors')
const auth = require("./core/authentication/auth");

const Pool = require('./core/db/dbPool');

// var Jimp = require("jimp")
// var sizeOf = require('image-size');




var corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  credentials:true,
  header:{
    'Access-Control-Allow-Origin':'*',
    // 'Content-Type': 'multipart/form-data', //     <-- IMPORTANT
  }
}


/***************
 * site
 *************/
var iskaotSiteRouter = require('./routes/site/iskaot');
/***************
 * site
 *************/





/***************
 * Admin
 *************/

var indexRouter = require('./routes/admin/index');
var usersRouter = require('./routes/admin/users');
var uploadRouter = require('./routes/admin/upload');
var couponsRouter = require('./routes/admin/coupons');
var sapakimRouter = require('./routes/admin/sapakim')
var sapakBranchesRouter = require('./routes/admin/sapakBranches')
var adminUsersRouter = require('./routes/admin/adminUsers')
var ticketTypesRouter = require('./routes/admin/ticketTypes')
var combinedTicketsRouter = require('./routes/admin/combinedTickets')
var featureGroupsRouter = require('./routes/admin/featureGroups')
var featureOptionsRouter = require('./routes/admin/featureOptions')
var featureOptionsPerIska = require('./routes/admin/featureOptionsPerIska')
var iskaCategoriesRouter = require('./routes/admin/iskaCategories')
var iskaotRouter = require('./routes/admin/iskaot')
var couponsRouter = require('./routes/admin/coupons')
var hallsRouter = require('./routes/admin/halls')
var chairStatusListRouter = require('./routes/admin/chairStatusList')
var upSalesRouter = require('./routes/admin/upSales')
var shipmentsRouter = require('./routes/admin/shipments')
var inlaysRouter = require('./routes/admin/inlays')
var ordersRouter = require('./routes/admin/orders')
var citiesRouter = require('./routes/admin/cities')
var orderStatusListRouter = require('./routes/admin/orderStatusList')
var reportRouter = require('./routes/admin/report')

var terminalAPIRouter = require('./routes/site/terminalAPI');

var {escapeParameters,checkUpload} = require('./core/utils/utils');
/***************
 * Admin
 *************/



var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.use(cors(corsOptions));
app.use(logger('dev'));
app.use(express.json({limit: '500mb'}));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));




// app.use((req, res, next) => {
//   if( req.body !== undefined && Object.keys(req.body).length > 0){
//       req.body = escapeParameters(req.body);
//       next();
//     }else{
//       next();
//   }
// })


app.use('/uploads', checkUpload)

app.use('/uploads',express.static(__dirname + '/uploads')); 


app.use(bodyParser.json({
  extended: true,
}));



/***************
 * site
 *************/
app.use('/site/iskaot', iskaotSiteRouter);
app.use('/terminalAPI', terminalAPIRouter);
 /***************
 * site
 *************/


/***************
 * Admin
 *************/
// app.use('/SMScodes',SMScodesRouter);

app.use('/admin', indexRouter);
app.use('/admin/users', usersRouter);
app.use('/admin/coupons',auth, couponsRouter);
app.use('/admin/sapakim',auth ,sapakimRouter);
app.use('/admin/sapakBranches' , auth ,sapakBranchesRouter);
app.use('/admin/adminUsers', auth , adminUsersRouter);
app.use('/admin/ticketTypes' , auth , ticketTypesRouter);
app.use('/admin/combinedTickets', auth ,combinedTicketsRouter);
app.use('/admin/featureGroups', auth ,featureGroupsRouter);
app.use('/admin/featureOptions', auth ,featureOptionsRouter);
app.use('/admin/featureOptionsPerIska', auth ,featureOptionsPerIska);
app.use('/admin/iskaCategories', auth ,iskaCategoriesRouter);
app.use('/admin/iskaot', auth ,iskaotRouter);
app.use('/admin/halls', auth ,hallsRouter);
app.use('/admin/chairStatusList', auth ,chairStatusListRouter);
app.use('/admin/upSales' , auth , upSalesRouter);
app.use('/admin/shipments', auth ,shipmentsRouter);
app.use('/admin/inlays', auth ,inlaysRouter);
app.use('/admin/orders',auth ,ordersRouter);
app.use('/admin/cities', citiesRouter);
app.use('/admin/orderStatusList',auth ,orderStatusListRouter);
app.use('/admin/report',reportRouter);
app.use('/admin/upload',uploadRouter);
/***************
 * Admin
 *************/



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
