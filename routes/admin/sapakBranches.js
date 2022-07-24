var express = require('express');
var router = express.Router();
var sapakBranches = require('./../../helpers/admin/sapakBranchesHelper');




router.post('/getAllBranches', async function(req, res, next) {
    let IDsapak = req.IDsapak    
    let sapakBranchesRes = await sapakBranches.getAllBranches(IDsapak)
    res.send(sapakBranchesRes)
});

router.post('/getAllBranchesToEdit', async function(req, res, next) {
    let IDsapak = req.IDsapak    
    let sapakBranchesRes = await sapakBranches.getAllBranchesToEdit(IDsapak)
    res.send(sapakBranchesRes)
});


router.post('/addbranch', async function(req, res, next) {
    let IDsapak = req.IDsapak    
    let branch = req.body.branch  
    let sapakBranchesRes = await sapakBranches.addbranch(IDsapak,branch)
    res.send(sapakBranchesRes)
});

router.post('/editBranchs', async function(req, res, next) {
    let IDsapak = req.IDsapak    
    let branchs = req.body.branchs
    let sapakBranchesRes = await sapakBranches.editBranchs(IDsapak,branchs)
    res.send(sapakBranchesRes)
});

module.exports = router; 