const express = require('express');
const router = express.Router();

const terminalsAPIHelper = require('./../../helpers/site/terminalsAPIHelper');


/******************************************
 *********** Router
 ******************************************/

router.get('/cardcom/:result', async function(req, res, next) {

    // מה שמגיע לרוטאר הזה בחזרה מקארדקום
    // http://localhost:3001/terminalAPI/cardcom/success?internaldealnumber=87511773

    console.log(req.params.result);
    let url = req.url;
    let result = req.params.result
    let terminalsRes = await terminalsAPIHelper.updateCardcomTerminal(url,result)
    res.send(terminalsRes)
});


module.exports = router; 