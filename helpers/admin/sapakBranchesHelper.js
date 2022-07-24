var Pool = require('./../../core/db/dbPool')
const https = require('https');
const fs = require('fs');
const GlobalFunction = require("./GlobalFunction")

const getAllBranches = async function(IDsapak){
    return new Promise((resolve, reject) => {
        Pool.query('SELECT IDbranch,branchName FROM sapakBranches WHERE IDsapak = (?);',[IDsapak], (err, row ,fields) => {
            if (err) return reject(err);
            if(row.length > 0){
                resolve({status : 'success' , data:row })
            }
                resolve({status : 'err'})
        
        })
    })
}

const getAllBranchesToEdit = async function(IDsapak){
    return new Promise((resolve, reject) => {
        Pool.query('SELECT sb.IDbranch,sb.branchName,sb.branchMezahe,sb.branchAddress,sb.branchContactPerson,sb.branchPhone,sb.branchFax,sb.branchEmail,sb.branchCCterminal,sb.branchCCterminalType,sb.branchCCterminalPwd,sb.branchAreaCover,sb.branchOpenHours,sapakim.packageType FROM sapakBranches as sb LEFT JOIN sapakim on(sb.IDsapak = sapakim.IDsapak) WHERE sapakim.IDsapak = (?);',[IDsapak], (err, row ,fields) => {
            if (err){
                console.log(err);
                return reject(err);
            }
            if(row.length > 0){
                resolve({status : 'success' , data:row })
            }
                resolve({status : 'err'})
        
        })
    })
}


// branchCCterminal,branchCCterminalType,branchCCterminalPwd
const addbranch = async function(IDsapak , branch){
    return new Promise((resolve, reject) => {
        Pool.query('INSERT INTO sapakBranches (IDsapak,branchName,branchMezahe,branchAddress,branchContactPerson,branchPhone,branchFax,branchEmail,branchCCterminal,branchCCterminalType,branchCCterminalPwd,branchAreaCover,branchOpenHours) VALUES ((?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?));',[IDsapak,branch.branchName,branch.branchMezahe,branch.branchAddress,branch.branchContactPerson,branch.branchPhone,branch.branchFax,branch.branchEmail,branch.branchCCterminal,branch.branchCCterminalType,branch.branchCCterminalPwd,branch.branchAreaCover,branch.branchOpenHours],async (err, row ,fields) => {
            if (err){
                console.log(err);
                return reject(err);
            } 
                console.log(row);
              if (row.affectedRows > 0){
                resolve({status : "success"})
              }else{
                resolve({status : "err"})
              }
        })
    })
}

async function checkBranchGama(options){
    //auth
    modeMockup = false;//if does not work server of Gama, doing tests on mockups
    return new Promise(async (resolve, reject) => {

         const host = ''+process.env.gamaReceiptIP+'gama-pay/v1.0/auth';
        // const host = '/gama-pay/1.0/auth';
            const httpsAgent = new https.Agent({
            rejectUnauthorized: false, // (NOTE: this will disable client verification)
            cert: fs.readFileSync("./config/sert/SpkConnection005.crt"),
            key: fs.readFileSync("./config/sert/SpkConnection005.key"),
            ca: fs.readFileSync("./config/sert/ca.crt"),
            pem: fs.readFileSync("./config/sert/ca.crt"),
            host: 'gwdemo.gamaf.co.il'
            // passphrase: "YYY"
          })

        var axios = require('axios');
        var data = {
            "clientId"      : options.branchCCterminal, 
            "clientSecret"  : options.branchCCterminalPwd
        };
        
        var config = {
        method: 'post',
        url: host,
        headers: { 
            'Content-Type': 'application/json; charset=utf-8'
        },
        data : JSON.stringify(data),
        httpsAgent: httpsAgent
        };
    
        console.log('The autorize query was sent', config);
    
        axios(config)
        .then(function (response) {
        console.log("Response of authorization from gama server invoices",(response.data));
        if(response.status == '200'){
            resolve({ error: false})

        }else{
            resolve ({'error': true, errorData: response.data});
        }
        })
        .catch(function (error) {
        console.log('error of authorization from gama server invoices', error);
            resolve({ error: true, errorData: error});

        });

    });

}

const updateBranch = async function(IDsapak , branch){
    // console.log(IDsapak , branch);
    return new Promise((resolve, reject) => {
        console.log(IDsapak , branch);
        Pool.query('UPDATE `sapakBranches` SET `branchName`=(?),`branchMezahe`=(?),`branchAddress`=(?),`branchContactPerson`=(?),`branchPhone`=(?),`branchFax`=(?),`branchEmail`=(?),`branchCCterminal`=(?),`branchCCterminalType`=(?),`branchCCterminalPwd`=(?),`branchAreaCover`=(?),`branchOpenHours`=(?) WHERE IDbranch = (?) AND IDsapak = (?);',[branch.branchName,branch.branchMezahe,branch.branchAddress,branch.branchContactPerson,branch.branchPhone,branch.branchFax,branch.branchEmail,branch.branchCCterminal,branch.branchCCterminalType,branch.branchCCterminalPwd,branch.branchAreaCover,branch.branchOpenHours , branch.IDbranch ,IDsapak],async (err, row ,fields) => {
            if (err){
                console.log(err);
                return reject(err);  
            } 
            resolve()
        })
    })
}

const editBranchs = async function(IDsapak , branchs){
    let allGood = true

    return new Promise(async(resolve, reject) => {
        await branchs.forEachAsync(async(branch) => {
            //
            if(branch['branchCCterminalType'] === 'gama' && !(branch['branchCCterminal'] ==='999999' && branch['branchCCterminalPwd'] ==='999999' ) ){
                let result =  await checkBranchGama(branch);
                console.log("checkBranchGama -> result ", result);
                if(result.error){
                    resolve({ status:"err", message:  "סוג מסוף סליקה גאמא , מספר עסק בגאמה "+branch['branchCCterminal']+" או סיסמת מסוף "+branch['branchCCterminalPwd']+" לא נכונים!" })
                }
            }
           let a = await updateBranch(IDsapak,branch)
        });
        resolve({status : "success"})
    })
}





module.exports ={
    getAllBranches , addbranch , getAllBranchesToEdit , editBranchs
}