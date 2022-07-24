var Pool = require('./../../core/db/dbPool')
var GlobalFunction = require('./../../helpers/admin/GlobalFunction')
const { trim, lastIndexOf } = require('lodash');
var validator = require('validator');
const { json } = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const fs = require("fs");
const path = require('path');  
const usersDir = path.resolve(__dirname + './../../uploads/')


const AddIskaValidators = async function(iska) {
    let valid = true
    let number_list_regex = /^[0-9]+(,[0-9]+)*$/
    let discount_list_regex = /^[0-9a-zA-Z]+(,[0-9a-zA-Z]+)*$/
    // console.log('iska ->', iska);
    return new Promise((resolve, reject) => {
        // וולידציה למספר ספק לא נדרש
        // if(!validator.isInt(iska.IDsapak.toString()) || validator.isEmpty(iska.IDsapak) || iska.IDsapak == null){
        //     valid = false
        //     return resolve(valid)
        // }
        if(iska.iskaType == null || validator.isEmpty(iska.iskaType) || !["attraction", "product-food", "professionals", "auction"].includes(iska.iskaType) || !validator.isLength(iska.iskaType, {max: 30})){
            valid = false
            if(process.env.DebugMode){console.log('Validator Error iskaType ->' , iska.iskaType )};
            return resolve(valid)
        }
        if(iska.iskaSubType != null){
            if(iska.iskaType == "product-food" && !validator.isAlpha(iska.iskaSubType) || iska.iskaType == "product-food" && !validator.isLength(iska.iskaSubType, {max: 30})){
                valid = false
                if(process.env.DebugMode){console.log('Validator Error iskaSubType ->' , iska.iskaSubType )};
                return resolve(valid)
            }
        }
        // לתקן שיקבל מערך
        // if(iska.iskaCategories == null || validator.isEmpty(iska.iskaCategories) || !number_list_regex.test(iska.iskaCategories.toString()) || !validator.isLength(iska.iskaCategories, {max: 1000})){
        //     valid = false
        //     return resolve(valid)
        // }
        // if(iska.iskaPhotos == null || validator.isEmpty(iska.iskaPhotos) || !validator.isLength(iska.iskaPhotos, {max: 1000})){
        //     valid = false
        //     return resolve(valid)
        // }
        if(iska.iskaName == null || validator.isEmpty(iska.iskaName) || !validator.isLength(iska.iskaName, {max: 100})){
            valid = false
            if(process.env.DebugMode){console.log('Validator Error iskaName ->' , iska.iskaName )};
            return resolve(valid)
        }
        if(iska.iskaDescription == null || validator.isEmpty(iska.iskaDescription) || !validator.isLength(iska.iskaDescription, {max: 250})){
            if(process.env.DebugMode){console.log('Validator Error iskaName ->' , iska.iskaName )};
            valid = false
            return resolve(valid)
        }
        if(iska.iskaReadMore == null || validator.isEmpty(iska.iskaReadMore) || !validator.isLength(iska.iskaReadMore, {max: 1000})){
            valid = false
            if(process.env.DebugMode){console.log('Validator Error iskaReadMore ->' , iska.iskaReadMore )};
            return resolve(valid)
        }
        if(iska.iskaSmallLetters == null || validator.isEmpty(iska.iskaSmallLetters) || !validator.isLength(iska.iskaSmallLetters, {max: 2000})){
            valid = false
            if(process.env.DebugMode){console.log('Validator Error iskaSmallLetters ->' , iska.iskaSmallLetters )};
            return resolve(valid)
        }
        if(iska.iskaAbout == null || validator.isEmpty(iska.iskaAbout) || !validator.isLength(iska.iskaAbout, {max: 1000})){
            valid = false
            if(process.env.DebugMode){console.log('Validator Error iskaAbout ->' , iska.iskaAbout )};
            return resolve(valid)
        }

        if(iska.iskaTakanon != null){
            if(iska.iskaTakanon == null || validator.isEmpty(iska.iskaTakanon) || !validator.isLength(iska.iskaTakanon, {max: 2000})){
                valid = false
                if(process.env.DebugMode){console.log('Validator Error iskaTakanon ->' , iska.iskaTakanon )};
                return resolve(valid)
            }
        }else{
            if(iska.iskaTakanonFileName == null || !validator.isLength(iska.iskaTakanonFileName, {max: 100})){
                valid = false
                if(process.env.DebugMode){console.log('Validator Error iskaTakanonFileName ->' , iska.iskaTakanonFileName )};
                return resolve(valid)
            }
        }


        if(iska.iskaCurrency == null || validator.isEmpty(iska.iskaCurrency) || !validator.isLength(iska.iskaCurrency, {max: 10}) || !["ils", "usd", "eur"].includes(iska.iskaCurrency)){
            valid = false
            if(process.env.DebugMode){console.log('Validator Error iskaCurrency ->' , iska.iskaCurrency )};
            return resolve(valid)
        }
        // if(iska.iskaInventory == null || ["auction", "product-food"].includes(iska.iskaType) && !validator.isInt(iska.iskaInventory.toString()) || ["auction", "product-food"].includes(iska.iskaType) && validator.isEmpty(iska.iskaInventory)){
        //     valid = false
        //     if(process.env.DebugMode){console.log('Validator Error iskaInventory ->' , iska.iskaInventory )};
        //     return resolve(valid)
        // }
        if(iska.iskaMaxPayments == null || !validator.isInt(iska.iskaMaxPayments.toString()) || validator.isEmpty(iska.iskaMaxPayments)){
            valid = false
            if(process.env.DebugMode){console.log('Validator Error iskaMaxPayments ->' , iska.iskaMaxPayments )};
            return resolve(valid)
        }
        if(iska.iskaFriendsShareDiscount == null || !validator.isInt(iska.iskaFriendsShareDiscount.toString()) || validator.isEmpty(iska.iskaFriendsShareDiscount)){
            valid = false
            if(process.env.DebugMode){console.log('Validator Error iskaFriendsShareDiscount ->' , iska.iskaFriendsShareDiscount )};
            return resolve(valid)
        }
        if(iska.iskaFriendsReturnDiscount == null || !validator.isInt(iska.iskaFriendsReturnDiscount.toString()) || validator.isEmpty(iska.iskaFriendsReturnDiscount)){
            valid = false
            if(process.env.DebugMode){console.log('Validator Error iskaFriendsReturnDiscount ->' , iska.iskaFriendsReturnDiscount )};
            return resolve(valid)
        }

        // if(iska.iskaUpsales == null || iska.iskaType != "auction" && !number_list_regex.test(iska.iskaUpsales.toString()) || iska.iskaType != "auction" && validator.isEmpty(iska.iskaUpsales) || iska.iskaType != "auction" && !validator.isLength(iska.iskaUpsales, {max: 2000})){
        //     valid = false
        //     if(process.env.DebugMode){console.log('Validator Error iskaReadMore ->' , iska.iskaReadMore )};
        //     return resolve(valid)
        // }

        if(iska.iskaBranches != null || !validator.isEmpty(iska.iskaBranches)){
            if(["auction", "product-food"].includes(iska.iskaType) && !number_list_regex.test(iska.iskaBranches.toString()) || ["auction", "product-food"].includes(iska.iskaType) && !validator.isLength(iska.iskaBranches, {max: 2000})){
                valid = false
                if(process.env.DebugMode){console.log('Validator Error iskaBranches ->' , iska.iskaBranches )};
                return resolve(valid)
            }
        }
        if(iska.iskaShipments != null || !validator.isEmpty(iska.iskaShipments)){
            if(["auction", "product-food"].includes(iska.iskaType) && !number_list_regex.test(iska.iskaShipments.toString()) || ["auction", "product-food"].includes(iska.iskaType) && !validator.isLength(iska.iskaShipments, {max: 2000})){
                valid = false
                if(process.env.DebugMode){console.log('Validator Error iskaShipments ->' , iska.iskaShipments )};
                return resolve(valid)
            }
        }

        // להחזיר שהושבה תהיה מוכנה
        // if(["attraction", "professionals"].includes(iska.iskaType))
        // {
        //     if(iska.ticketTypes != null || !validator.isEmpty(iska.ticketTypes)){
        //         if(iska.iskaType == "attraction" && !number_list_regex.test(iska.ticketTypes.toString()) || iska.iskaType == "attraction" && !validator.isLength(iska.ticketTypes, {max: 400})){
        //             valid = false
        //         if(process.env.DebugMode){console.log('Validator Error attraction.ticketTypes ->' , iska.ticketTypes )};
        //             return resolve(valid)
        //         }
        //     }
        //     if(iska.combinedTickets != null || !validator.isEmpty(iska.combinedTickets)){
        //         if(iska.iskaType == "attraction" && !number_list_regex.test(iska.combinedTickets.toString()) || iska.iskaType == "attraction" && !validator.isLength(iska.combinedTickets, {max: 400})){
        //             valid = false
        //         if(process.env.DebugMode){console.log('Validator Error iska.combinedTickets ->' , iska.combinedTickets )};
        //             return resolve(valid)
        //         }
        //     }
        //     if(iska.dynamicPriceDiscount != null){
        //         if(!validator.isInt(iska.dynamicPriceDiscount.toString())){
        //             valid = false
        //         if(process.env.DebugMode){console.log('Validator Error iska.dynamicPriceDiscount ->' , iska.dynamicPriceDiscount )};
        //             return resolve(valid)
        //         }
        //     }
        //     if(iska.dynamicPriceRaise != null){
        //         if(!validator.isInt(iska.dynamicPriceRaise.toString())){
        //             valid = false
        //         if(process.env.DebugMode){console.log('Validator Error iska.dynamicPriceRaise ->' , iska.dynamicPriceRaise )};
        //             return resolve(valid)
        //         }
        //     }
        //     if(iska.hallWidth != null){
        //         if(!validator.isInt(iska.hallWidth.toString())){
        //             valid = false
        //         if(process.env.DebugMode){console.log('Validator Error iska.hallWidth ->' , iska.hallWidth )};
        //             return resolve(valid)
        //         }
        //     }
        //     if(iska.hallLength != null){
        //         if(!validator.isInt(iska.hallLength.toString())){
        //             valid = false
        //         if(process.env.DebugMode){console.log('Validator Error iska.hallLength ->' , iska.hallLength )};
        //             return resolve(valid)
        //         }
        //     }
        //     if(iska.roundTime != null){
        //         if(!validator.isInt(iska.roundTime.toString())){
        //             valid = false
        //         if(process.env.DebugMode){console.log('Validator Error iska.roundTime ->' , iska.roundTime )};
        //             return resolve(valid)
        //         }
        //     }
        //     if(iska.reOrganizeTime != null){
        //         if(!validator.isInt(iska.reOrganizeTime.toString())){
        //             valid = false
        //         if(process.env.DebugMode){console.log('Validator Error iska.reOrganizeTime ->' , iska.reOrganizeTime )};
        //             return resolve(valid)
        //         }
        //     }
        //     if(iska.minimumTicketsPerOrder != null){
        //         if(!validator.isInt(iska.minimumTicketsPerOrder.toString())){
        //             valid = false
        //         if(process.env.DebugMode){console.log('Validator Error iskaReadMore ->' , iska.minimumTicketsPerOrder )};
        //             return resolve(valid)
        //         }
        //     }
        //     if(iska.minimumTicketsInFirstOrder != null){
        //         if(!validator.isInt(iska.minimumTicketsInFirstOrder.toString())){
        //             valid = false
        //         if(process.env.DebugMode){console.log('Validator Error iska.minimumTicketsInFirstOrder ->' , iska.minimumTicketsInFirstOrder )};
        //             return resolve(valid)
        //         }
        //     }
        //     if(iska.maximumTicketsPerRound != null){
        //         if(!validator.isInt(iska.maximumTicketsPerRound.toString())){
        //             valid = false
        //         if(process.env.DebugMode){console.log('Validator Error iska.maximumTicketsPerRound ->' , iska.maximumTicketsPerRound )};
        //             return resolve(valid)
        //         }
        //     }
        // }
        
        if(["product-food", "professionals"].includes(iska.iskaType))
        {
            if(iska.featureGroups != null || !validator.isEmpty(iska.featureGroups)){
                if(!number_list_regex.test(iska.featureGroups.toString()) || !validator.isLength(iska.featureGroups, {max:400})){
                    valid = false
                    if(process.env.DebugMode){console.log('Validator Error iska.featureGroups ->' , iska.featureGroups )};
                    return resolve(valid)
                }
            }
            if(iska.basicIskaPrice == null || iska.iskaType == "product-food" && !validator.isFloat(iska.basicIskaPrice.toString()) || iska.iskaType == "product-food" && validator.isEmpty(iska.basicIskaPrice)){
                valid = false
                if(process.env.DebugMode){console.log('Validator Error iska.basicIskaPrice ->' , iska.basicIskaPrice )};
                return resolve(valid)
            }
            if(iska.quantityDiscount == null || iska.iskaType == "product-food" && !discount_list_regex.test(iska.quantityDiscount.toString()) || iska.iskaType == "product-food" && !validator.isLength(iska.quantityDiscount, {max: 1000}) || iska.iskaType == "product-food" && validator.isEmpty(iska.quantityDiscount)){
                valid = false
                if(process.env.DebugMode){console.log('Validator Error iska.quantityDiscount ->' , iska.quantityDiscount )};
                return resolve(valid)
            }
        }

        if(iska.iskaType == "auction")
        {
            if(iska.priceImport != null){
                if(iska.priceImport == null || !validator.isFloat(iska.priceImport.toString())){
                    valid = false
                    if(process.env.DebugMode){console.log('Validator Error iska.priceImport ->' , iska.priceImport)};
                    return resolve(valid)
                }
            }
            if(iska.priceMarket != null){
                if(iska.priceMarket == null || !validator.isFloat(iska.priceMarket.toString())){
                    valid = false
                    if(process.env.DebugMode){console.log('Validator Error iska.priceMarket ->' , iska.priceMarket )};
                    return resolve(valid)
                }
            }
            if(iska.priceStore != null){
                if(iska.priceStore == null || !validator.isFloat(iska.priceStore.toString())){
                    valid = false
                    if(process.env.DebugMode){console.log('Validator Error iska.priceStore ->' , iska.priceStore )};
                    return resolve(valid)
                }
            }
            if(iska.bidMinimumPrice != null){
                if(iska.bidMinimumPrice == null || !validator.isInt(iska.bidMinimumPrice.toString())){
                    valid = false
                    if(process.env.DebugMode){console.log('Validator Error iska.bidMinimumPrice ->' , iska.bidMinimumPrice )};
                    return resolve(valid)
                }
            }
            if(iska.bidParticipateFee != null){
                if(iska.bidParticipateFee == null || !validator.isFloat(iska.bidParticipateFee.toString())){
                    valid = false
                    if(process.env.DebugMode){console.log('Validator Error iska.bidParticipateFee ->' , iska.bidParticipateFee )};
                    return resolve(valid)
                }
            }
            if(iska.minimumBidders != null){
                if(iska.minimumBidders == null || !validator.isInt(iska.minimumBidders.toString())){
                    valid = false
                    if(process.env.DebugMode){console.log('Validator Error iska.minimumBidders ->' , iska.minimumBidders )};
                    return resolve(valid)
                }
            }
            if(iska.auctionExpiration != null){
                if(iska.auctionExpiration == null || !validator.isDate(iska.auctionExpiration.toString())){
                    valid = false
                    if(process.env.DebugMode){console.log('Validator Error iska.auctionExpiration ->' , iska.auctionExpiration )};
                    return resolve(valid)
                }
            }
            
        }
        resolve(valid)

    })
}








const addIska = async function(IDsapak,iska,pLang){  
    return new Promise(async (resolve, reject) => {
        let res = true
        console.log('AddIskaValidators res ->' , res);
        if(res){

            // בדיקה שמספר עסקה לא קים אם כן מחליפים אותו

            let IDiskaExist = await GlobalFunction.getFields('iskaot','IDiska','where IDiska = ' + iska.IDiska)
            if(IDiskaExist != 'notFound'){
                let NewIDiska = await GlobalFunction.getRandNumber(7,'iskaot','IDiska')
                Pool.query('UPDATE `featureOptionsPerIska` SET `IDiska`=(?) WHERE `IDsapak` = (?) AND `IDiska` = (?)',[NewIDiska, IDsapak ,iska.IDiska],(err, row ,fields) => {
                    console.log(err, row);
                })
                Pool.query('UPDATE `coupons` SET `IDiska`=(?) WHERE `IDsapak` = (?) AND `IDiska` = (?)',[NewIDiska, IDsapak ,iska.IDiska],(err, row ,fields) => {
                    console.log(err, row);
                })
                Pool.query('UPDATE `inlays` SET `IDiska`=(?) WHERE `IDsapak` = (?) AND `IDiska` = (?)',[NewIDiska, IDsapak ,iska.IDiska],(err, row ,fields) => {
                    console.log(err, row);
                })
                iska.IDiska = NewIDiska
            }

            // מנימום מקסימום למוצר מזון נקבע אוטומטי
            if(iska.iskaType== 'product-food'){
                iska.minimumTicketsPerOrder = 1
                iska.maximumTicketsPerRound = 1000
            }
            if(iska.iskaType == 'auction'){
                iska.basicIskaPrice =  iska.bidMinimumPrice
            }

            // הכנסת עסקה במצב לא פעיל 
            // במצב הדגמה העסקה גם נכנסת כלא פעילה
            iska.isActive = 0
            let userPermission = await GlobalFunction.getFields('adminUsers','userPermission','where IDsapak = ' + IDsapak)
            if(userPermission != 'notFound'){
                userPermission = userPermission[0].userPermission
                if(userPermission == 'sapak-demo'){
                    iska.isActive = 0
                }
            }

            //העברה של תמונות לתיקיה המתאימה
            if(iska.iskaPhotos){
                iska.iskaPhotos.forEach(element => {
                    let oldPath = path.resolve(usersDir + '/' + element)
                    let newPath = path.resolve(usersDir + '/users/' + IDsapak + '/' + element)
                    if (fs.existsSync(oldPath)){
                        fs.rename(oldPath, newPath, function (err) {
                            if (err) throw err
                            console.log('Successfully up sale img moved')
                        })
                    }
                });
            }

            if(iska.iskaTakanonFileName){
                    let oldPath = path.resolve(usersDir + '/' + iska.iskaTakanonFileName)
                    let newPath = path.resolve(usersDir + '/users/' + IDsapak + '/' + iska.iskaTakanonFileName)
                    if (fs.existsSync(oldPath)){
                        fs.rename(oldPath, newPath, function (err) {
                            if (err) throw err
                            console.log('iskaTakanonFileName up sale img moved')
                        })
                    }
            }

            if(iska.iskaAboutFileName){
                let oldPath = path.resolve(usersDir + '/' + iska.iskaAboutFileName)
                let newPath = path.resolve(usersDir + '/users/' + IDsapak + '/' + iska.iskaAboutFileName)
                if (fs.existsSync(oldPath)){
                    fs.rename(oldPath, newPath, function (err) {
                        if (err) throw err
                        console.log('iskaAboutFileName up sale img moved')
                    })
                }
            }
            // Object.keys(iska).forEach((key , i) => {
            //     console.log(iska[key] , '--->' , typeof(iska[key]));
            //     if(iska[key] == 'object'){
            //         iska[i] = JSON.stringify(iska[i])
            //     }
            // });
            // console.log(iska);
            // return
            // המרה ל JSON של מערכים
            iska.quantityDiscount = JSON.stringify(iska.quantityDiscount)
            iska.featureGroups = iska.featureGroups.toString()
            if(iska.iskaPhotos)
            iska.iskaPhotos = iska.iskaPhotos.toString()
            
            if(iska.iskaUpsales)
                iska.iskaUpsales = iska.iskaUpsales.toString()
            iska.iskaPickupBranches = iska.iskaPickupBranches.toString()
            iska.iskaCategories = iska.iskaCategories.toString()
            iska.iskaShipments = iska.iskaShipments.toString()
            iska.iskaBranches = iska.iskaBranches.toString()
            iska.ticketTypes = iska.ticketTypes.toString()
            // iska.iskaFreeShipment = iska.iskaFreeShipment.toString()

            // console.log(iska);
            // return
            console.log(iska);

            Pool.query('INSERT INTO iskaot (IDsapak, IDiska, iskaType, iskaSubType, iskaCategories, iskaPhotos, iskaName, iskaDescription, iskaReadMore, iskaSmallLetters, iskaAbout, iskaTakanon, iskaTakanonFileName, iskaCurrency, iskaInventory, iskaMaxPayments, iskaFriendsShareDiscount, iskaFriendsReturnDiscount, iskaUpsales, iskaBranches, iskaPickupBranches , iskaFreeShipment, iskaShipments, ticketTypes, combinedTickets, dynamicPriceDiscount, dynamicPriceRaise, hallWidth, hallLength, roundTime, reOrganizeTime, minimumTicketsPerOrder, minimumTicketsInFirstOrder, maximumTicketsPerRound, featureGroups, basicIskaPrice, quantityDiscount, priceImport, priceMarket, priceStore, bidMinimumPrice, bidParticipateFee, minimumBidders, auctionExpiration, isActive, iskaAboutFileName, iskaAboutFileNameLink, creationDate) VALUES ((?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?), now());',[IDsapak, iska.IDiska, iska.iskaType, iska.iskaSubType, iska.iskaCategories, iska.iskaPhotos, iska.iskaName, iska.iskaDescription, iska.iskaReadMore, iska.iskaSmallLetters, iska.iskaAbout, iska.iskaTakanon, iska.iskaTakanonFileName, iska.iskaCurrency, iska.iskaInventory, iska.iskaMaxPayments, iska.iskaFriendsShareDiscount, iska.iskaFriendsReturnDiscount, iska.iskaUpsales, iska.iskaBranches, iska.iskaPickupBranches, iska.iskaFreeShipment, iska.iskaShipments, iska.ticketTypes, iska.combinedTickets, iska.dynamicPriceDiscount, iska.dynamicPriceRaise, iska.hallWidth, iska.hallLength, iska.roundTime, iska.reOrganizeTime, iska.minimumTicketsPerOrder, iska.minimumTicketsInFirstOrder, iska.maximumTicketsPerRound, iska.featureGroups, iska.basicIskaPrice, iska.quantityDiscount, iska.priceImport, iska.priceMarket, iska.priceStore, iska.bidMinimumPrice, iska.bidParticipateFee, iska.minimumBidders, iska.auctionExpiration,iska.isActive, iska.iskaAboutFileName,iska.iskaAboutFileNameLink],
            async (err, row ,fields) => {
                if (err) {
                    console.log(err);
                    return reject(err);
                }
                if(row.affectedRows > 0){
                    
                    // *************************************
                    // שליחת הודעה לספק אחרי הוספת הודעה להמשיך כאן
                    // *************************************
                    let sapakim =  await GlobalFunction.getFields('sapakim','sapakPhone',"WHERE IDsapak='"+IDsapak+"'")
                    let systemMessages =  await GlobalFunction.getFields('systemMessages','msgContent',"WHERE IDmsg=1037 AND msgLang='"+pLang+"'")
                    console.log(sapakim , systemMessages);
                    let msg,sapakPhone = ""
                    if (sapakim!='notFound') { sapakPhone = sapakim[0].sapakPhone }
                    if (systemMessages!='notFound') {  msg = systemMessages[0].msgContent }
                    let url = process.env.pBaseURL + '/products/' + iska.IDiska
                    msg = msg.replace('[[url]]', url)
                    await GlobalFunction.sendSMS(sapakPhone , msg)
                    resolve({status : 'success'})
                }else{
                    resolve({status : 'err'})
                }
            })
        }else{
            resolve({status : 'err'})
        }
    })
}




const editIska = async function(IDsapak , addiska){  
    console.log('addiskadflkt3-04',addiska);
    addiska.iskaPhotos.forEach(element => {
        let oldPath = path.resolve(usersDir + '/' + element)
        let newPath = path.resolve(usersDir + '/users/' + IDsapak + '/' + element)
        if (fs.existsSync(oldPath)){
            fs.rename(oldPath, newPath, function (err) {
                if (err) throw err
                console.log('Successfully up sale img moved')
            })
        }
    });

    addiska.quantityDiscount = JSON.stringify(addiska.quantityDiscount)
    addiska.featureGroups = addiska.featureGroups.toString()
    addiska.iskaPhotos = addiska.iskaPhotos.toString()
    addiska.iskaUpsales = addiska.iskaUpsales.toString()
    addiska.iskaPickupBranches = addiska.iskaPickupBranches.toString()
    addiska.iskaCategories = addiska.iskaCategories.toString()
    addiska.iskaShipments = addiska.iskaShipments.toString()
    addiska.iskaBranches = addiska.iskaBranches.toString()
    addiska.ticketTypes = addiska.ticketTypes.toString()

    if(addiska.iskaType == 'auction'){
        addiska.basicIskaPrice =  addiska.bidMinimumPrice
    }

    if(addiska.iskaType == 'attraction' && addiska.IDhall){
        await updateHall(IDsapak , addiska.IDiska , addiska.IDhall)
    }

    
    console.log("addiska.iskaAboutFileName,addiska.iskaAboutFileNameLink",addiska.iskaAboutFileName,addiska.iskaAboutFileNameLink);

    return new Promise((resolve, reject) => {
        Pool.query('UPDATE `iskaot` SET `iskaType`=(?),`iskaSubType`=(?),`iskaCategories`=(?),`iskaPhotos`=(?),`iskaName`=(?),`iskaDescription`=(?),`iskaReadMore`=(?),`iskaSmallLetters`=(?),`iskaAbout`=(?),`iskaTakanon`=(?),`iskaTakanonFileName`=(?),`iskaCurrency`=(?),`iskaInventory`=(?),`iskaMaxPayments`=(?),`iskaFriendsShareDiscount`=(?),`iskaFriendsReturnDiscount`=(?),`iskaUpsales`=(?),`iskaBranches`=(?),`iskaPickupBranches`=(?),`iskaFreeShipment`=(?),`iskaShipments`=(?),`ticketTypes`=(?),`combinedTickets`=(?),`dynamicPriceDiscount`=(?),`dynamicPriceRaise`=(?),`hallWidth`=(?),`hallLength`=(?),`featureGroups`=(?),`basicIskaPrice`=(?),`quantityDiscount`=(?),`priceImport`=(?),`priceMarket`=(?),`priceStore`=(?),`bidMinimumPrice`=(?),`bidParticipateFee`=(?),`minimumBidders`=(?),`auctionExpiration`=(?),`iskaAboutFileName`=(?),`iskaAboutFileNameLink`=(?) WHERE IDsapak = (?) AND IDiska = (?)',[addiska.iskaType,addiska.iskaSubType,addiska.iskaCategories,addiska.iskaPhotos,addiska.iskaName,addiska.iskaDescription,addiska.iskaReadMore,addiska.iskaSmallLetters,addiska.iskaAbout,addiska.iskaTakanon,addiska.iskaTakanonFileName,addiska.iskaCurrency,addiska.iskaInventory,addiska.iskaMaxPayments,addiska.iskaFriendsShareDiscount,addiska.iskaFriendsReturnDiscount,addiska.iskaUpsales,addiska.iskaBranches,addiska.iskaPickupBranches,addiska.iskaFreeShipment,addiska.iskaShipments,addiska.ticketTypes,addiska.combinedTickets,addiska.dynamicPriceDiscount,addiska.dynamicPriceRaise,addiska.hallWidth,addiska.hallLength,addiska.featureGroups,addiska.basicIskaPrice,addiska.quantityDiscount,addiska.priceImport,addiska.priceMarket,addiska.priceStore,addiska.bidMinimumPrice,addiska.bidParticipateFee,addiska.minimumBidders,addiska.auctionExpiration,addiska.iskaAboutFileName,addiska.iskaAboutFileNameLink,IDsapak,addiska.IDiska], (err, row ,fields) => {
        
            console.log("fieldsdfgdfhgfgd",fields);
            console.log("errdfgldljshgs",err);
            console.log("rowdfgldljshgs",row);
            if (err) return reject(err);
            if(row.affectedRows > 0){
                resolve({status : 'success'})
            }else{
                resolve({status : 'err'})
            }
            // console.log(row);
        })
    })
}



const updateHall = async function(IDsapak , IDiska , IDhall){  
    return new Promise(async(resolve, reject) => { 
    console.log('*** updateHall ***');
    console.log(IDsapak , IDiska , IDhall);
        let IDIskaot = await GlobalFunction.getFields('halls', 'IDIskaot' , "where IDsapak = '"+IDsapak+"' AND IDhall = '+"+IDhall+"'")
        if(IDIskaot != 'notFound'){
            IDIskaot = IDIskaot[0].IDIskaot.split(',')
            if(IDIskaot.includes(IDiska)){
                resolve()
                return
            }
        }

    
        Pool.query('update halls set IDIskaot=CONCAT(IDIskaot,",?") where IDsapak = (?) AND IDhall = (?)',[IDiska,IDsapak,IDhall], (err, row ,fields) => {
            if (err){
                console.log(err);
                return reject(err);
            }
            resolve()  
        })
    })
}


const deleteIska = async function(IDsapak , IDiska){  
    return new Promise(async(resolve, reject) => {
        let ordersForIska = await GlobalFunction.getFields('orders','idx',"where IDiska = '" + IDiska + "' AND IDsapak = '" +IDsapak+ "' LIMIT 3" )
        if(ordersForIska != 'notFound'){
            resolve({status : 'err' , details : 'Active orders'})  
            return
        }
        Pool.query('DELETE FROM `iskaot` WHERE `IDsapak` = (?) AND `IDiska` = (?)',[IDsapak,IDiska], (err, row ,fields) => {
            if (err){
                console.log(err);
                return reject(err);
            }
            if(row.affectedRows > 0){
                resolve({status : 'success'})  
            }else{
                resolve({status : 'err'})  
            }
        })
    })
}

const getAlliskaot = async function(IDsapak){  
    return new Promise((resolve, reject) => {
        Pool.query('SELECT DISTINCT iskaot.IDiska,iskaName,iskaPhotos,iskaCurrency, case    WHEN basicIskaPrice >0 THEN basicIskaPrice  else ifnull(tableMinPrice.minPrice,0)  end as basicIskaPrice ,iskaot.isActive,iskaType, IFNULL(IDbranch,0) as IDBranch, IFNULL(branchCCterminalType,"") as terminalType, IFNULL(branchMezahe,0) as branchMezahe , IFNULL(branchEmail,0) as branchEmail, IFNULL(branchContactPerson,0) as branchContactPerson, IFNULL(branchPhone,0) branchPhone, IFNULL(branchAddress,0) as branchPhone, iskaot.IDsapak FROM iskaot left join sapakBranches as sapakBranchesMin on iskaot.IDsapak = sapakBranchesMin.IDsapak join (SELECT iskaot.IDiska, min(ticketTypesPerIska.ttPrice) as minPrice FROM iskaot left join ticketTypesPerIska on iskaot.IDiska = ticketTypesPerIska.IDiska where iskaot.IDsapak = (?) GROUP BY IDiska) as tableMinPrice  on tableMinPrice.IDiska = iskaot.IDiska where iskaot.IDsapak = (?) and sapakBranchesMin.IDbranch in (select min(idBranch) as IDbranch from sapakBranches group by IDsapak)',[IDsapak,IDsapak], (err, row ,fields) => {
            if (err){
                console.log(err);
                return reject(err);
            } 
            if(row.length > 0){
                row.forEach(element => {
                    if(element.iskaPhotos){
                        let iskaPhotos = element.iskaPhotos.split(',')
                        element.iskaPhotos = iskaPhotos[0]
                    }
                });
                resolve({status : 'success' , data:row })
            }
                resolve({status : 'err'})
        })
    })
}

const changeIskaActive = async function(IDsapak,IDiska,isActive){
    return new Promise(async(resolve, reject) => {
        
        let userPermission = await GlobalFunction.getFields('adminUsers','userPermission','where IDsapak = ' + IDsapak)
        if(userPermission != 'notFound'){
            userPermission = userPermission[0].userPermission
            if(userPermission == 'sapak-demo'){
                resolve({status : 'err' , details : 7899})
                return
            }
        }else{
            resolve({status : 'err' , details : 7899})
            return
        }

        Pool.query('UPDATE iskaot SET isActive = (?) WHERE IDsapak = (?) And IDiska = (?);',[!isActive,IDsapak,IDiska], (err, row ,fields) => {
            if (err) return reject(err);
            if(row.affectedRows > 0){
                resolve({status : 'success'})
            }else{
                resolve({status : 'err'})
            }
        })
    })
}


const duplicationIska = async function(IDsapak,IDiska){
    return new Promise(async(resolve, reject) => {

        let userPermission = await GlobalFunction.getFields('adminUsers','userPermission','where IDsapak = ' + IDsapak)
        if(userPermission != 'notFound'){
            userPermission = userPermission[0].userPermission
            if(userPermission == 'sapak-demo'){
                resolve({status : 'err' , details : 7898})
                return
            }
        }else{
            resolve({status : 'err' , details : 7898})
            return
        }


        Pool.query('SELECT * FROM iskaot WHERE IDsapak = (?) AND IDiska = (?);',[IDsapak , IDiska],async (err, row ,fields) => {
            
            row[0]['idx'] = null
            // שכפול תמונות
            if(row[0]['iskaPhotos']){
                row[0]['iskaPhotos'] = row[0]['iskaPhotos'].split(',')
                row[0]['iskaPhotos'].forEach(Photo => {
                    let PhotoPath = path.resolve(__dirname + './../../uploads/users/' +  IDsapak + '/' + Photo)
                    let newPhotoPath = path.resolve(__dirname + './../../uploads/users/' +  IDsapak + '/' + uuidv4() + path.parse(Photo).ext)
                    fs.createReadStream(PhotoPath).pipe(fs.createWriteStream(newPhotoPath));
                    Photo = newPhotoPath
                });   
            }

            row[0]['quantityDiscount'] = JSON.parse(row[0]['quantityDiscount'])
            row[0]['iskaUpsales'] = null

            let newIska = row[0]
            newIska.IDiska = await GlobalFunction.getRandNumber(7 , 'iskaot' , 'IDiska')


            // עדכון טבלאות אחרות //
            // ***************************
            // במצב אטרקציה בלבד
            if(row[0]['iskaType'] == 'attraction'){

                // שיוך של האולם לעסקה המשוכפלת
                // Pool.query("SELECT * FROM halls WHERE IDsapak = (?) AND IDIskaot like '%?%';",[IDsapak , IDiska],async (err, row ,fields) => {
                //     if(err){
                //         console.log(err);
                //     }
                //     let IDhall = row[0].IDhall
                //     let IDIskaotRes = await GlobalFunction.getFields('halls','IDIskaot',"WHERE IDhall ='"+IDhall+"'")
                //     IDIskaot = IDIskaotRes[0].IDIskaot
                //     IDIskaot += ',' + newIska.IDiska
                //     Pool.query('UPDATE `halls` SET `IDIskaot` = (?) WHERE `halls`.`IDhall` = (?);',[IDIskaot , IDhall],async (err, row ,fields) => {
                //         if(err){
                //             console.log(err);
                //         }
                //         console.log(row);
                //     })
                    
                // })
                // הוספת כרטיסים כמו לעסקה המשוכפלת
                Pool.query("SELECT * FROM ticketTypesPerIska WHERE IDiska = (?);",[IDiska],async (err, row ,fields) => {
                    if(err){
                        console.log(err);
                    }
                    let sql = 'INSERT INTO ticketTypesPerIska (IDticketType,IDiska, ttPrice, ttDisplayOrder) VALUES '
                    row.forEach(element => {
                        sql += '(' + element.IDticketType
                        sql += ',' + newIska.IDiska
                        sql += ',' + element.ttPrice
                        sql += ',' + element.ttDisplayOrder
                        sql += '),'
                    });
                    sql = sql.slice(0, -1)
                    console.log(sql);
                    Pool.query(sql,async (err, row ,fields) => {
                        if(err){
                            console.log(err);
                        }
                        console.log(row);
                    })                    
                })
            }


            addIskaRes = await addIska(IDsapak , newIska , 'he')
            
            addIskaRes.IDiska  = newIska.IDiska
            console.log('addIskaRes' , addIskaRes);
            resolve(addIskaRes)

        })

    })
}
const getIskaByIDiska = async function(IDsapak,IDiska){
    return new Promise(async(resolve, reject) => {
        Pool.query('SELECT * FROM iskaot WHERE IDsapak = (?) AND IDiska = (?);',[IDsapak , IDiska], async (err, row ,fields) => {
            if (err) return reject(err);
            if(row.length > 0){

                // מצב של עסקה מסוג אטקציה צריך לקבל גם את שם האולם
                if(row[0].iskaType == 'attraction'){
                    Res = await GlobalFunction.getFields('halls','hallName,IDhall',"WHERE IDsapak = '"+ IDsapak +"' AND IDIskaot like '%"+row[0].IDiska+"%' ")
                    console.log('Res' , Res);
                    if(Res != 'notFound'){
                        row[0].hallName = Res[0].hallName
                        row[0].IDhall = Res[0].IDhall
                    }
                    
                    // console.log("WHERE IDsapak = '"+ IDsapak +"' AND IDIskaot like '%,"+row[0].IDiska+",%' ");
                    // return
                }

                // if(row[0].iskaPhotos != ""){
                //     let iskaPhotos = row[0].iskaPhotos.split(',')
                //     row[0].iskaPhotos = ""
                //     for (let i = 0; i < iskaPhotos.length; i++) {
                //         row[0].iskaPhotos += IDsapak + '/' + iskaPhotos[i] + ','
                //     }
                    
                //     console.log(row[0].iskaPhotos);
                //     // row[0].iskaPhotos.toString()
                // }
                resolve({status : 'success' , data:row[0] })
            }
                resolve({status : 'err'})
        })
    })
}

const grantIDiska = async function(digits , tableName , fieldName){
    return new Promise(async (resolve, reject) => {
        let RandNumber = await GlobalFunction.getRandNumber(digits , tableName , fieldName)
        resolve({RandNumber:RandNumber})
    })
}


// const grantIDiska = async function(digits , tableName , fieldName){
//     return new Promise((resolve, reject) => {

//         Pool.query('SELECT * FROM iskaot WHERE IDsapak = (?) AND IDiska = (?);',[IDsapak , IDiska], (err, row ,fields) => {
//             if (err) return reject(err);
//             if(row.length > 0){
//                 resolve({status : 'success' , data:row[0] })
//             }
//                 resolve({status : 'err'})
//         })
//     })
// }


// const editIska = async function(iska){  
//     return new Promise(async (resolve, reject) => {
//         let res = await myvalidator.AddIskaValidators(iska)
//         if(res){
//             Pool.query(`INSERT INTO iskaot (IDsapak, iskaType, iskaSubType, iskaCategories, iskaPhotos, iskaName, iskaDescription, iskaReadMore, iskaSmallLetters, iskaAbout, iskaTakanon, iskaTakanonFileName, iskaCurrency, iskaInventory, iskaMaxPayments, iskaFriendsShareDiscount, iskaFriendsReturnDiscount, iskaUpsales, iskaBranches, iskaShipments, ticketTypes, combinedTickets, dynamicPriceDiscount, dynamicPriceRaise, hallWidth, hallLength, roundTime, reOrganizeTime, minimumTicketsPerOrder, minimumTicketsInFirstOrder, maximumTicketsPerRound, featureGroups, basicIskaPrice, quantityDiscount, priceImport, priceMarket, priceStore, bidMinimumPrice, bidParticipateFee, minimumBidders, auctionExpiration) VALUES ((?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?),(?));`,
//             [Pool.escape(iska.IDsapak), Pool.escape(iska.iskaType), Pool.escape(iska.iskaSubType), Pool.escape(iska.iskaCategories), Pool.escape(iska.iskaPhotos), Pool.escape(iska.iskaName), Pool.escape(iska.iskaDescription), Pool.escape(iska.iskaReadMore), Pool.escape(iska.iskaSmallLetters), Pool.escape(iska.iskaAbout), Pool.escape(iska.iskaTakanon), Pool.escape(iska.iskaTakanonFileName), Pool.escape(iska.iskaCurrency), Pool.escape(iska.iskaInventory), Pool.escape(iska.iskaMaxPayments), Pool.escape(iska.iskaFriendsShareDiscount), Pool.escape(iska.iskaFriendsReturnDiscount), Pool.escape(iska.iskaUpsales), Pool.escape(iska.iskaBranches), Pool.escape(iska.iskaShipments), Pool.escape(iska.ticketTypes), Pool.escape(iska.combinedTickets), Pool.escape(iska.dynamicPriceDiscount), Pool.escape(iska.dynamicPriceRaise), Pool.escape(iska.hallWidth), Pool.escape(iska.hallLength), Pool.escape(iska.roundTime), Pool.escape(iska.reOrganizeTime), Pool.escape(iska.minimumTicketsPerOrder), Pool.escape(iska.minimumTicketsInFirstOrder), Pool.escape(iska.maximumTicketsPerRound), Pool.escape(iska.featureGroups), Pool.escape(iska.basicIskaPrice), Pool.escape(iska.quantityDiscount), Pool.escape(iska.priceImport), Pool.escape(iska.priceMarket), Pool.escape(iska.priceStore), Pool.escape(iska.bidMinimumPrice), Pool.escape(iska.bidParticipateFee), Pool.escape(iska.minimumBidders), Pool.escape(iska.auctionExpiration)],
//             async (err, row ,fields) => {
//                 if (err) return reject(err);
//                 if(row.affectedRows > 0){
//                     resolve({status : 'success'})
//                 }else{
//                     resolve({status : 'err'})
//                 }
//             })
//         }else{
//             resolve({status : 'err'})
//         }
//     })
// }

module.exports ={
    addIska , getAlliskaot , changeIskaActive, duplicationIska , getIskaByIDiska , grantIDiska , editIska , deleteIska
}
