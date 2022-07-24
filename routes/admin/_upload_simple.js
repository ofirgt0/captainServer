const express = require('express');
const router = express.Router();
const formidable = require('formidable');
const { v4: uuidv4 } = require('uuid');
var fs = require('fs');


const auth = require("../../core/authentication/auth");
const path = require('path');  

//העלאת קבצים לפני הרשמה לפי מספר פאלפון
router.post( '/', auth,  async function(req, res, next) {
    let userPhone = req.userPhone
    let Myfile = {
        userPhone:String,
        IDsapak:String,
        newPath:String,
        oldPath:String,
        newfileName:String,
        oldfileName:String,
    }
    Myfile.IDsapak = req.IDsapak
    Myfile.userPhone = req.userPhone
    var form = new formidable.IncomingForm();


    form.on('fileBegin',async (name, file) => {
        let uuid = uuidv4()
        let oldfileName =  uuid + path.parse(file.name).ext
        let oldPath =  path.resolve(__dirname + './../uploads/' + oldfileName);
        console.log(oldPath);
        //upload העלאת הקובץ לתיקיה 
        file.path = oldPath
        Myfile.oldPath = oldPath
        Myfile.oldfileName = oldfileName
        console.log('1');
    });

    form.parse(req, (err, fields, files) => {
        if (err) {
            console.log('Error', err)
            return
        }

        // fields.imgType + '_' + IDsapak 
        // console.log( Myfile.oldPath , Myfile.oldfileName );
        // מצב שמשתמש רשום מעלה קבצים
        Myfile.newfileName = uuidv4() + path.parse(files.file.name).ext
        // if(Myfile.IDsapak){
        //     // Myfile.newPath = './../uploads/user/' + IDsapak + path.parse(files.file.name).ext  
        //     // להמשיך מכאן לראות למה לא מנווט נכון
        // }
        
        // // // מצב של משתמש חדש 
        // // //העלאת קבצים לפני הרשמה לפי מספר פאלפון
        // if(Myfile.userPhone){
        //     Myfile.newfileName = uuidv4() + path.parse(files.file.name).ext  

        // }
        // usersImg
        console.log(Myfile);
        return
        if (fs.existsSync(path)) {
            
        }

        console.log('2');

    })

    form.on('end',async (file) => {
        // Myfile.oldPath = path.resolve(__dirname + './../uploads/' + Myfile.oldfileName);
        // Myfile.newPath = path.resolve(__dirname + './../uploads/' + Myfile.newfileName);

        res.send({status:'success' , fileName: Myfile.newfileName})
        // console.log(Myfile.oldPath , Myfile.newPath);
        // fs.rename(Myfile.oldPath , Myfile.newPath, function(err) {
        //     console.log(err);
        //     if (err) next(err);

        //     //     res.end();
        //     console.log(Myfile.newfileName);
        // });
    });




        // fs.rename(files.my_file.path, fields.project_id, function(err) {
        //     if (err) next(err);
        //     res.end();
        // });
        // console.log(Myfile);

    // let uploadFile={
    //   userPhone: req.IDuser,
    //   imgType:"",
    //   url:""
    // }
  
    // if (fs.existsSync(path)) {
    //     // Do something
    // }
  
    // form.on('field', (name, fields) => {  
    //   uploadFile.imgType = fields.imgType
    // });
    // form.on('file', (name, file) => {    
    //     console.log(2);
    // });
  

    // form.parse(req, (err, fields, file) => {
    //   if (err) {
    //       console.log('Error', err)
    //       return
    //   }
    //   uploadFile.userPhone = userPhone
    //   console.log(3);
    // })
    //   form.on('end',async (file) => {
    //     res.send({status:'success' , url:uploadFile.url})
    // });
    
  
  });
  
  module.exports = router;
  