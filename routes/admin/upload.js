const express = require('express');
const router = express.Router();
const formidable = require('formidable');
const { v4: uuidv4 } = require('uuid');
var fs = require('fs');

const GlobalFunction = require('./../../helpers/admin/GlobalFunction');


const auth = require("./../../core/authentication/auth");
const path = require('path');  
const usersDir = path.resolve(__dirname + './../../uploads/users')


const addMadieFolder = async function(IDsapak){
    return new Promise(async (resolve, reject) => {
        //יצירת תיקית משתמש
        let userFoldar =  path.resolve(__dirname + './../../uploads/users/' + IDsapak);
        if (!fs.existsSync(userFoldar)) {
            fs.mkdirSync(userFoldar)
            resolve('new')
        }else{
            resolve('exist')
        }
    })
}

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
        //הגדרת שם הקובץ
        let oldfileName =  uuid + path.parse(file.name).ext
        let oldPath =  path.resolve(__dirname + './../../uploads/' + oldfileName);
        //upload העלאת הקובץ לתיקיה 
        file.path = oldPath
        Myfile.oldPath = oldPath
        Myfile.oldfileName = oldfileName

        console.log(('****************************'));
        console.log(Myfile);
        console.log(('****************************'));
    });

    form.parse(req, async (err, fields, files) => {
        if (err) { 
            console.log('Error', err)
            return
        }

        if(!req.IDsapak){
            let res = await GlobalFunction.getFields("adminUsers","IDsapak","where userPhone = '"+req.userPhone+"'")
            req.IDsapak = res[0].IDsapak
            Myfile.IDsapak = req.IDsapak
        }
        
   
        let ResAddMadieFolder = await addMadieFolder(req.IDsapak)
        
        console.log('fields876543',fields);
        //upsale מצב של העלאת תמונה 
        if(fields.imgType == 'up_sale'){
            Myfile.newPath = path.resolve(path.parse(Myfile.oldPath).dir + '/users/' + Myfile.IDsapak + '/upsale/' +  path.parse(Myfile.oldPath).name + path.parse(Myfile.oldPath).ext) 
            // בדיקה אם קיימת תיקיה ואם לא יצירה שלה
            let upsaleDir =  path.resolve(usersDir + '/' +  Myfile.IDsapak + '/upsale/')
            if (!fs.existsSync(upsaleDir)){
                fs.mkdirSync(upsaleDir);
            }
            fs.rename(Myfile.oldPath, Myfile.newPath, function (err) {
                if (err) throw err
                console.log('Successfully up sale img moved')
            })
        }

      
        // העברה של התמונה  אוטומטי אם נמצא במצב עריכה
        if((fields.isEditMode == 'true' && (fields.imgType == 'Photos_of_the_deal' || fields.imgType == 'video_of_the_deal' || fields.imgType == 'iskaTakanon' ||fields.imgType == 'iskaAbout' || fields.imgType == 'sapakLogo')|| ResAddMadieFolder == "new") ){
            Myfile.newPath = path.resolve(path.parse(Myfile.oldPath).dir + '/users/' + Myfile.IDsapak + '/' +  path.parse(Myfile.oldPath).name + path.parse(Myfile.oldPath).ext) 
            console.log('Myfile.newPath3453765',Myfile.newPath);
            console.log('Myfile =>' , Myfile);
            if (fs.existsSync(Myfile.oldPath)){
                fs.rename(Myfile.oldPath, Myfile.newPath, function (err) {
                    if (err) throw err
                    console.log('Successfully img moved In Edit Mode')
                })
            }
        }

        // רק למצב של ספק חדש שמעלה תמונות של הלוגו
        if((fields.isEditMode == 'false' && (fields.imgType == 'sapakLogo')|| ResAddMadieFolder == "new") ){
            Myfile.newPath = path.resolve(path.parse(Myfile.oldPath).dir + '/users/' + Myfile.IDsapak + '/' +  path.parse(Myfile.oldPath).name + path.parse(Myfile.oldPath).ext) 
            console.log('Myfile =>' , Myfile);
            if (fs.existsSync(Myfile.oldPath)){
                fs.rename(Myfile.oldPath, Myfile.newPath, function (err) {
                    if (err) throw err
                    console.log('Successfully img moved In Edit Mode')
                })
            }
        }
      
        // else if(fields.imgType == 'Photos_of_the_deal' || fields.imgType == 'video_of_the_deal' || fields.imgType == 'iskaTakanon'){

        //     Myfile.newPath = path.resolve(path.parse(Myfile.oldPath).dir + '/users/' + Myfile.IDsapak + '/' +  path.parse(Myfile.oldPath).name + path.parse(Myfile.oldPath).ext) 
        //     // בדיקה אם קיימת תיקיה ואם לא יצירה שלה
        //     let ImgVideoDir =  path.resolve(usersDir + '/' +  Myfile.IDsapak + '/'+fields.IDiska+'/')
        //     if (!fs.existsSync(ImgVideoDir)){
        //         fs.mkdirSync(ImgVideoDir);
        //     }
        //     fs.rename(Myfile.oldPath, Myfile.newPath, function (err) {
        //         if (err) throw err
        //         console.log('Successfully Photos_of_the_deal img moved')
        //     })
        // }

        // כאן שולפים fields
        // Myfile.newfileName = uuidv4() + path.parse(files.file.name).ext


    })

    form.on('end',async (file) => {

        res.send({status:'success' , fileName: Myfile.oldfileName})
   
    });


  
  });
  
  module.exports = router;
  