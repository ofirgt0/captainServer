var express = require('express');
var router = express.Router();
var inlaysHelper = require('./../../helpers/admin/inlaysHelper');


router.post('/getAllCalendarsByIdSapak', async function(req, res, next) {
    let IDsapak = req.IDsapak
    let validRes = await inlaysHelper.getAllCalendarsByIdSapak(IDsapak);
    res.send(validRes)  
});
router.post('/addFirstInlays', async function(req, res, next) {
    let IDsapak = req.IDsapak
    let CalendarInlays = req.body.CalendarInlays
    let Setting_up_rounds = req.body.Setting_up_rounds
    let validRes = await inlaysHelper.addFirstInlays(IDsapak,CalendarInlays,Setting_up_rounds);
    res.send(validRes)  
});
// router.post('/addFirstInlays', async function(req, res, next) {
//     let IDsapak = req.IDsapak
//     let CalendarInlays = req.body.CalendarInlays
//     let Setting_up_rounds = req.body.Setting_up_rounds
//     let validRes = await inlaysHelper.addFirstInlays(IDsapak,CalendarInlays,Setting_up_rounds);
//     res.send(validRes)  
// });

router.post('/getAllinlayByIdIska', async function(req, res, next) {
    let IDsapak = req.IDsapak
    let IDiska = req.body.IDiska
    let firstWeekDay = req.body.firstWeekDay
    let TotalTimeForRound_first = req.body.TotalTimeForRound_first
    console.log(req.body);
    let validRes = await inlaysHelper.getAllinlayByIdIska(IDsapak,IDiska,firstWeekDay,TotalTimeForRound_first);
    res.send(validRes)  
});

router.post('/getDaySelectedByMonth', async function(req, res, next) {
    let IDsapak = req.IDsapak
    let IDiska = req.body.IDiska
    let MonthStartDay = req.body.MonthStartDay
    let validRes = await inlaysHelper.getDaySelectedByMonth(IDsapak,IDiska,MonthStartDay);
    res.send(validRes)  
});

// router.post('/getAllinlayByIdIska', async function(req, res, next) {
//     let IDsapak = req.IDsapak
//     let IDiska = req.body.IDiska
//     let validRes = await inlaysHelper.getAllinlayByIdIska(IDsapak,IDiska);
//     res.send(validRes)  
// });

router.post('/Stop_or_ReleaseRound', async function(req, res, next) {
    let IDsapak = req.IDsapak
    let IDiska = req.body.IDiska
    let IDinlay = req.body.IDinlay
    let validRes = await inlaysHelper.Stop_or_ReleaseRound(IDsapak,IDiska,IDinlay);
    res.send(validRes)  
});

router.post('/deleteOneRound', async function(req, res, next) {
    let IDsapak = req.IDsapak
    let IDiska = req.body.IDiska
    let IDinlay = req.body.IDinlay
    let validRes = await inlaysHelper.deleteOneRound(IDsapak,IDiska,IDinlay);
    res.send(validRes)  
});

router.post('/addOneRound', async function(req, res, next) {
    let IDsapak = req.IDsapak
    let IDiska = req.body.IDiska
    let dateStr = req.body.dateStr
    let validRes = await inlaysHelper.addOneRound(IDsapak,IDiska,dateStr);
    res.send(validRes)  
});

router.post('/addBrake', async function(req, res, next) {
    let IDsapak = req.IDsapak
    let IDiska = req.body.IDiska
    let dateStr = req.body.dateStr
    let TotalTime = req.body.TotalTime
    let validRes = await inlaysHelper.addBrake(IDsapak,IDiska,dateStr,TotalTime);
    res.send(validRes)  
});

router.post('/deleteBrake', async function(req, res, next) {
    let IDsapak = req.IDsapak
    let IDiska = req.body.IDiska
    let IDinlay = req.body.IDinlay
    let validRes = await inlaysHelper.deleteBrake(IDsapak,IDiska,IDinlay);
    res.send(validRes)  
});


router.post('/DuplicateWeek', async function(req, res, next) {
    let IDsapak = req.IDsapak
    let IDiska = req.body.IDiska
    let weekStartDate = req.body.weekStartDate
    let validRes = await inlaysHelper.DuplicateWeek(IDsapak,IDiska,weekStartDate);
    res.send(validRes)  
});

router.post('/changeMaximumTickets', async function(req, res, next) {
    let IDsapak = req.IDsapak
    let IDiska = req.body.IDiska
    let maximumTicketsPerRound = req.body.maximumTicketsPerRound
    let validRes = await inlaysHelper.changeMaximumTickets(IDsapak,IDiska,maximumTicketsPerRound);
    res.send(validRes)  
});

router.post('/getTicketTypes', async function(req, res, next) {
    let IDsapak = req.IDsapak
    let IDiska = req.body.IDiska
    let validRes = await inlaysHelper.getTicketTypes(IDiska);
    res.send(validRes)  
});

router.post('/deleteDay', async function(req, res, next) {
    let IDsapak = req.IDsapak
    let IDiska = req.body.IDiska
    let dayToDelete = req.body.dayToDelete
    let validRes = await inlaysHelper.deleteDay(IDiska,dayToDelete);
    res.send(validRes)  
});



module.exports = router; 