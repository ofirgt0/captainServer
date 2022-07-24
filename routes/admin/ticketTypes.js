var express = require('express');
var router = express.Router();
var ticketType = require('./../../helpers/admin/ticketTypesHelper');


router.post('/getAllTicketTypes', async function(req, res, next) {

    let IDsapak = req.IDsapak    
    let IDiska = req.body.IDiska    
    let ticketTypeRes = await ticketType.getAllTicketTypes(IDsapak,IDiska)
    res.send(ticketTypeRes)

});


router.post('/addTicketTypes', async function(req, res, next) {
    let IDsapak = req.IDsapak     
    let Ticket = req.body.Ticket
    let ticketTypeRes = await ticketType.addTicketTypes(IDsapak,Ticket)
    res.send(ticketTypeRes)

});

router.post('/EditTicketTypes', async function(req, res, next) {
    let IDsapak = req.IDsapak    
    let Ticket = req.body.Ticket
    let ticketTypeRes = await ticketType.EditTicketTypes(IDsapak,Ticket)
    res.send(ticketTypeRes)
});

router.post('/deleteTicketTypes', async function(req, res, next) {
    let IDsapak = req.IDsapak    
    let IDticketType = req.body.IDticketType
    let ticketTypeRes = await ticketType.deleteTicketTypes(IDsapak,IDticketType)
    res.send(ticketTypeRes)
});


router.post('/getTicketTypePerIska', async function(req, res, next) {
    let IDsapak = req.IDsapak    
    let IDiska = req.body.IDiska    
    let IDticketType = req.body.IDticketType
    let ticketTypeRes = await ticketType.getTicketTypePerIska(IDsapak,IDiska,IDticketType)
    res.send(ticketTypeRes)
});

router.post('/addTicketPerIska', async function(req, res, next) {
    let IDsapak = req.IDsapak    
    let IDiska = req.body.IDiska    
    let TicketPerIska = req.body.TicketPerIska
    let ticketTypeRes = await ticketType.addTicketPerIska(IDsapak,IDiska,TicketPerIska)
    res.send(ticketTypeRes)
});

router.post('/deleteTicketPerIska', async function(req, res, next) {
    let IDsapak = req.IDsapak    
    let IDiska = req.body.IDiska    
    let IDticketType = req.body.IDticketType
    let ticketTypeRes = await ticketType.deleteTicketPerIska(IDsapak,IDiska,IDticketType)
    res.send(ticketTypeRes)
});




module.exports = router; 