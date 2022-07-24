const https = require('https');
const fs = require('fs');

const Pool = require('./../../core/db/dbPool')
const _ = require('underscore');
const GlobalFunction = require('./../../helpers/admin/GlobalFunction')
// const AddOrderHelper = require('./AddOrderHelper')
const ordersHelper = require('./../admin/ordersHelper')
const addDays = require('date-fns/addDays')
const addMinutes = require('date-fns/addMinutes')
const format = require('date-fns/format')

const Cryptr = require('cryptr');
const cryptr = new Cryptr(process.env.cryptr_SECRET);
// שימוש בפונק' הצפנה ופענוח
//cryptr.encrypt("text");
//cryptr.decrypt("hashed");


//קבלת מספר עסקה אחרונה במערכת
const checkeIfIskaValid = async function(IDiska,IDinlay){  
    return new Promise(async(resolve, reject) => {
        if (IDiska && !IDinlay) {
            // מצב שמגיעים רק עם מספר עסקה
            // בדיקה שהעסקה קיימת פעילה
            Pool.query("SELECT IDiska FROM iskaot WHERE isActive=1 AND IDIska = (?);",[IDiska], async (err, row ,fields) => {
                if(row.length>0){
                    resolve(true)
                }else{
                    resolve(false)
                }
            })
            
        } else if(IDiska && IDinlay) {
            // מצב שמגיעים עם מספר עסקה ומספר רשומה של יומן
            // בדיקה שיש רשומת פעילה שהתאריך שלה לא עבר
            Pool.query("SELECT IDiska,iskaType FROM iskaot WHERE isActive=1 ;",[IDiska], async (err, row ,fields) => {
                if(row.length>0){
                Pool.query("SELECT IDinlay FROM inlays WHERE isActive=1 AND IDIska = (?) AND IDinlay = (?) AND inlaySchedule >= CURDATE();",[IDiska,IDinlay], async (err, rowIDinlay ,fields) => {
                    if(rowIDinlay.length > 0){
                        resolve(true)
                    }else{
                        resolve(false)
                    }
                })
                }else{
                    resolve(false)
                }
            })
        }
    })
}




const getLastIskaHelper = async function(SQLrow){
    return new Promise((resolve, reject) => {
        Pool.query("SELECT IDiska,iskaType FROM iskaot WHERE isActive=1 AND iskaType='professionals' ORDER BY idx DESC LIMIT "+SQLrow.toString()+";",[], async (err, row ,fields) => {
            if (err) return reject(err);
            // console.log(row.length , SQLrow , row.length >= SQLrow);
            if(row.length >= SQLrow){
                let IDiska = row[SQLrow-1].IDiska
                // let IDinlay = row[SQLrow-1].IDinlay
                if(row[SQLrow-1].iskaType == 'attraction' || row[SQLrow-1].iskaType == 'professionals'){
                    Pool.query("SELECT IDinlay FROM inlays WHERE isActive=1 AND IDIska = (?) AND inlaySchedule >= CURDATE() ORDER BY inlaySchedule LIMIT 1;",[IDiska], (err, rowIDinlay ,fields) => {
                        if(rowIDinlay.length > 0){
                            IDinlay = rowIDinlay[0].IDinlay
                            resolve({status : 'success' , IDiska:row[0].IDiska , IDinlay:IDinlay})
                        }else{
                            resolve({status : 'minierr' , SQLrow})   
                        }
                    })
                }else{
                    // מצב שלא צריך להוסיף מזהה רשומת פעילות
                    resolve({status : 'success' , IDiska:row[0].IDiska})
                }
                return
            }else{
                // אין אף עסקה פעילה במסד, אין תוצאות להחזיר 
                resolve({status:'err' , IDiska:0 , SQLrow:SQLrow })                       
            }           
        })
    })
}  
 
//קבלת מספר עסקה אחרונה במערכת
const getLastIska = async function(IDiska,IDinlay){  

    // מצב שמגיעים בלי נתונים וצריכים הפניה לעסקה הכי חדשה    
    return new Promise(async(resolve, reject) => {
    
        
        // if(IDiska && IDinlay) {
        //     let resCheckeIfIskaValid = await checkeIfIskaValid(IDiska,IDinlay)
        //     if(!resCheckeIfIskaValid){
        //         resolve({status : 'err' , Details : 'iska not valid'})
        //         return
        //     }
        // }else{
            let SQLrow = 1
            let res
            do {
                res = await getLastIskaHelper(SQLrow)
                SQLrow = SQLrow +1 
                console.log(SQLrow , res);
            }
            while (res.status != 'success' && res.status != 'err');
            resolve({status : 'success' , data:{IDiska:res.IDiska , IDinlay:res.IDinlay}})
        // }

    })
}



// קבלת כל הפרטים לכותרת העסקה
const getIskaHeaderDetails = async function(IDiska,IDinlay){  
        return new Promise((resolve, reject) => {
            // Pool.query('SELECT iskaot.IDsapak,IDiska,iskaName,iskaType,iskaSubType,iskaDescription,iskaReadMore,iskaPhotos,basicIskaPrice,iskaCurrency,quantityDiscount,iskaType,iskaReadMore,iskaSmallLetters,iskaAbout,iskaDescription,iskaTakanon,iskaTakanonFileName,iskaUpsales,iskaMaxPayments,iskaFriendsShareDiscount,iskaFriendsReturnDiscount,maximumTicketsPerRound,minimumTicketsPerOrder,priceImport,priceMarket,priceStore,bidMinimumPrice,bidParticipateFee,minimumBidders,auctionExpiration,sapakim.sapakName,sapakim.sapakLogo FROM iskaot LEFT JOIN sapakim on(iskaot.IDsapak=sapakim.IDsapak) WHERE IDiska = (?) AND isActive = 1',[IDiska],async (err, row ,fields) => {
            Pool.query('SELECT iskaot.IDsapak,IDiska,iskaName,iskaType,iskaSubType,iskaDescription,iskaReadMore,iskaPhotos,basicIskaPrice,iskaCurrency,quantityDiscount,iskaType,iskaReadMore,iskaSmallLetters,iskaAbout,iskaDescription,iskaTakanon,iskaTakanonFileName,iskaAboutFileName,iskaAboutFileNameLink,iskaUpsales,iskaMaxPayments,iskaFriendsShareDiscount,iskaFriendsReturnDiscount,maximumTicketsPerRound,minimumTicketsPerOrder,priceImport,priceMarket,priceStore,bidMinimumPrice,bidParticipateFee,minimumBidders,auctionExpiration,sapakim.sapakName,sapakim.sapakLogo, iskaot.isActive FROM iskaot LEFT JOIN sapakim on(iskaot.IDsapak=sapakim.IDsapak) WHERE IDiska = (?)',[IDiska],async (err, row ,fields) => {
                console.log('err,row1', err,row);
                if (err) return reject(err);
                if(row.length && !row[0].isActive){
                    let query='SELECT iskaot.IDiska FROM iskaot left JOIN inlays on iskaot.IDiska = inlays.IDIska WHERE (iskaType="professionals" or iskaType = "attraction") and iskaot.isActive=1 and iskaot.IDsapak=(?) and inlays.inlaySchedule>=Now() UNION SELECT iskaot.IDiska FROM iskaot WHERE IDsapak=(?) and not (iskaType="professionals" or iskaType = "attraction") and iskaot.isActive=1 LIMIT 1';
                    Pool.query(query,[row[0].IDsapak,row[0].IDsapak],async (err, rowAddition ,fields) => {
                        console.log('err,rowAddition2', err,rowAddition);
                        resolve({status : 'err' , Details:'iska is not active', IDiskaAdditional: rowAddition.length? rowAddition[0].IDiska: null })
                        return
                    });
                    // לא נמצאה עסקה
                }
                else if(row.length == 0){
                    // לא נמצאה עסקה
                    resolve({status : 'err' , Details:'iska not found'})
                    return
                }
                else{
                    let IDsapak = row[0].IDsapak
                    if(row.length > 0){
                        let data = row[0]
                        if(data.iskaPhotos != ""){
                            data.iskaPhotos = data.iskaPhotos.split(',')
                            for (let i = 0; i < data.iskaPhotos.length; i++) {
                                data.iskaPhotos[i] = IDsapak + '/' + data.iskaPhotos[i]
                            }
                        }
                        
                        data.sapakLogo = IDsapak + '/' + data.sapakLogo
                        // בניית הנחת כמות כמערך
                        if(data.quantityDiscount){
                            if(GlobalFunction.IsJsonString(data.quantityDiscount)){
                                data.quantityDiscount = JSON.parse(data.quantityDiscount)
                            }else{
                                data.quantityDiscount = []
                            }
                        }
                        // הכנת קישור קובץ תקנון
                        if(data.iskaTakanonFileName){
                            data.iskaTakanonFileName = IDsapak + '/' + data.iskaTakanonFileName
                            console.log(data.iskaTakanonFileName)
                        }
                        if(data.iskaAboutFileName ){
                            data.iskaAboutFileName  = IDsapak + '/' + data.iskaAboutFileName 
                            console.log(data.iskaAboutFileName )
                        }
                        // console.log(data)
    
                        // בדיקת מינימום להזמנה רק אם יש מספר רשומה ביומן
    
                        if(data.iskaType == 'professionals'){
                            let IDinlay
                            if(!IDinlay){
                                IDinlay = await getIDinlay(IDiska)
                                data.IDinlay = IDinlay
                            }
                            data.minimumTicketsPerOrder = await GlobalFunction.getMinimumForOrder(IDinlay)          
                            data.maximumTicketsPerRound = await GlobalFunction.getInlayMaxAvailableTickets(IDinlay)          
                        }
    
    
    
                        if(data.iskaType == 'auction'){
                            data.auctionParticipants = 0
                            let res = await GlobalFunction.getFields('orders' , 'count(idx) as auctionParticipants' , "WHERE IDiska='"+IDiska+"'")
                            if(res != 'notFound'){
                                data.auctionParticipants = res[0].auctionParticipants
                            }
    
                        }
                        
                        
           
    
                        resolve({status : 'success' , data:data })
                    }
                        resolve({status : 'err'})
                }
            })
    })
}

const getIDinlay = async function(IDiska){  
    if(!IDiska){
        resolve('NotFound')   
        return
    }
    return new Promise((resolve, reject) => {
        Pool.query("SELECT IDinlay FROM inlays WHERE isActive=1 AND IDIska = (?) AND inlaySchedule >= CURDATE() ORDER BY inlaySchedule LIMIT 1;",[IDiska], (err, rowIDinlay ,fields) => {
            if(rowIDinlay.length > 0){
                IDinlay = rowIDinlay[0].IDinlay
                resolve(IDinlay)
            }else{
                resolve('NotFound')   
            }
        })
    })
}


const getSapakBranches = async function(IDsapak , IDbranch){  
        return new Promise((resolve, reject) => {
            let IDbranchSql = ""
            if(IDbranch){
                IDbranchSql = 'AND IDbranch = ' + IDbranch + ' '
            }
            Pool.query('SELECT IDbranch,branchName,branchAddress,branchPhone,branchFax,branchEmail FROM sapakBranches WHERE IDsapak = (?) ' + IDbranchSql + ' ORDER BY branchName;',[IDsapak], (err, row ,fields) => {
                if (err){
                    console.log(err);
                    return reject(err);
                } 
                if(row.length > 0){
                    resolve({status : 'success' , data:row[0] })
                }else{
                    resolve({status : 'err' , Details:'not found result' })                    

                }
            })

    })
}

//קבלת עוד מוצרים למוצרים נוספים
const getMoreIskaot = async function(IDiska,cartProductsExis){  
        return new Promise((resolve, reject) => {
            Pool.query('SELECT IDsapak,iskaType,iskaCurrency FROM iskaot WHERE IDiska = (?);',[IDiska], async(err, rowIDsapak ,fields) => {
                if (err) return reject(err);
                if(rowIDsapak.length == 0){
                    // לא נמצאה עסקה
                    resolve({status : 'err' , Details:'iska not found'})
                    return
                }
                let IDsapak = rowIDsapak[0].IDsapak
                let iskaType =  rowIDsapak[0].iskaType
                let iskaCurrency =  rowIDsapak[0].iskaCurrency
                Pool.query('SELECT iskaot.IDiska,iskaName,iskaPhotos,iskaType,case    WHEN basicIskaPrice >0 THEN basicIskaPrice  else ifnull(tableMinPrice.minPrice,0)  end as basicIskaPrice,iskaCurrency FROM iskaot left join (SELECT iskaot.IDiska, Min(ticketTypesPerIska.ttPrice) as minPrice FROM iskaot left join ticketTypesPerIska on iskaot.IDiska = ticketTypesPerIska.IDiska  GROUP BY IDiska) as tableMinPrice  on tableMinPrice.IDiska = iskaot.IDiska WHERE IDsapak = (?) and iskaType = (?) AND iskaot.IDiska <> (?) AND iskaCurrency = (?) AND iskaot.isActive = 1 AND iskaot.IDiska NOT IN (?);',[IDsapak,iskaType,IDiska,iskaCurrency,cartProductsExis], (err, row ,fields) => {
               
                row.forEach(element => {
                    if(element.iskaPhotos){
                        let iskaPhotos = element.iskaPhotos.split(',')
                        element.iskaPhotos = IDsapak + '/' + iskaPhotos[0]
                    }
                });
                resolve({status : 'success' , data:row })
                 
                })

            })
            return

    })
}


//קבלת כרטיסים לעסקה מסוג אטרקציה
const getTicketTypes = async function(IDiska){  
    return new Promise((resolve, reject) => {
        Pool.query('SELECT ttpi.IDticketType,ttpi.ttPrice,ttpi.ttDisplayOrder,ttpi.ticketsCountInside,tt.ttName FROM ticketTypesPerIska as ttpi RIGHT JOIN ticketTypes as tt ON(ttpi.IDticketType = tt.IDticketType) WHERE IDiska = (?) order by ttpi.ttDisplayOrder;',[IDiska], async(err, row ,fields) => {
            if (err){
                console.log(err);
                return reject(err);
            } 
            // console.log(row);
            if(row.length == 0){
                // לא נמצאה עסקה
                resolve({status : 'err' , Details:'not found tickets'})
                return
            }else{
                resolve({status : 'success' , data:row})
            }
        }) 
    })
}




//העסקה footerקבלת כל הפרטים ל  
const getIskaFooterDetails = async function(IDiska,IDsapak){
        
        if(!IDsapak){
            resIDsapak = await GlobalFunction.getFields('iskaot' , 'IDsapak' , 'WHERE IDiska = ' + IDiska)   
            IDsapak = resIDsapak[0].IDsapak
        }

        return new Promise(async(resolve, reject) => {
            if(IDsapak){
                let IDbranch = await GlobalFunction.getFields('iskaot' , 'iskaBranches' , "WHERE IDiska = '" + IDiska +"'")
                console.log('IDbranch' , IDbranch);
                
                if(IDbranch && IDbranch != 'notFound'){
                    if(IDbranch[0].iskaBranches != null){
                        IDbranch = IDbranch[0].iskaBranches
                        IDbranch = IDbranch.split(',')
                        IDbranch = IDbranch[0]
                    }else{
                        IDbranch = null
                    }
                }else{
                    IDbranch = null
                }

                if(!IDbranch){
                    IDbranch = await GlobalFunction.getFields('sapakBranches','IDbranch', "WHERE IDsapak = '" + IDsapak + "' ORDER BY IDbranch ASC LIMIT 1")
                    if(IDbranch != 'notFound')
                    IDbranch = IDbranch[0].IDbranch
                }


                console.log('************');
                console.log(IDbranch);
                console.log('************');
                let SapakBranches = await getSapakBranches(IDsapak,IDbranch)
                Pool.query('SELECT sapakName,sapakLogo,sapakOwnerName,sapakPhone,sapakEmail,sapakFax,sapakFacebook,sapakYouTube,sapakInstegram FROM sapakim WHERE IDsapak = (?);',[IDsapak], (err, row ,fields) => {
                    row[0].sapakLogo = IDsapak + '/' + row[0].sapakLogo
                    if (err) return reject(err);
                    if(row.length > 0){
                        row[0].SapakBranches = SapakBranches.data
                        resolve({status : 'success' , data:row[0]})
                    }else{
                        resolve({status : 'err' , Details:'err 5297'})
                    }
                })

            }else{
                resolve({status : 'err' , Details:'err 5299'})
            }
                
           
    })
}

const getQuantityDiscount = async function(IDiska){  
    return new Promise((resolve, reject) => {
        Pool.query('SELECT quantityDiscount FROM iskaot WHERE IDiska = (?);',[IDiska], (err, row ,fields) => {
            if (err) return reject(err);
            if(row.length > 0){
                // בניית הנחת כמות כמערך
                if(row[0].quantityDiscount){
                    if(GlobalFunction.IsJsonString(row[0].quantityDiscount)){
                        row[0].quantityDiscount = JSON.parse(row[0].quantityDiscount)
                    }else{
                        row[0].quantityDiscount = []
                    }
                }
                
                resolve(row[0].quantityDiscount)
            }
                resolve({status : 'err'})
        })
    })
}

const getFeatureOptions = async function(IDiska){  

        // let arr = await GetFeatureOptionsGroupByIDiska(IDiska)
        // console.log(arr);
        // return
        let res = await GlobalFunction.getFields('iskaot','iskaType,iskaSubType',"WHERE IDiska = '" +IDiska+ "'")
        console.log('iskaType' , res);
        
        let filterSql = ""
        if(!(res[0].iskaType == 'product-food' && (res[0].iskaSubType == 'pizza' || res[0].iskaSubType == 'salad'))){
            filterSql+= ' AND fg.fgName IS NOT NULL '
        }

        return new Promise((resolve, reject) => {
            Pool.query('SELECT fo.IDfo, fo.foName, fo.IDfg, fg.fgName, fopi.foPrice, fopi.isPrecentage,iskaot.IDiska,iskaot.iskaSubType,iskaot.minimumTicketsPerOrder,iskaot.maximumTicketsPerRound FROM featureOptionsPerIska as fopi LEFT JOIN featureOptions as fo ON (fopi.IDfo=fo.IDfo) LEFT JOIN featureGroups as fg ON (fo.IDfg=fg.IDfg) LEFT JOIN iskaot ON (iskaot.IDiska=fopi.IDiska) WHERE fopi.IDiska=(?) AND fopi.foInventory > 0 '+filterSql+' ORDER BY fg.fgName, fo.foName',[IDiska], async(err, row ,fields) => {
                // console.log(row);
                if (err) return reject(err);
                let ExtrasFood = []

                    if(row.length > 0){
                        if(row[0].iskaSubType == 'pizza' || row[0].iskaSubType == 'salad'){
                            ExtrasFood = await this.getAllExtrasFood(IDiska)
                        }
    
                        ExtrasFood.forEach(element => {
                            row.push(element)
                        });
                    }

                    // // row.concat(...ExtrasFood);
                    // console.log(row);
                    // return

                    
                    // console.log(row);

                    let data
                    data = row.filter(element => {
                        // if(element.fgName != null){
                            return element
                        // }
                    });
            
                    await data.forEachAsync(async(element) => {
                        if(element.isPrecentage){
                            element.foPrice = await GlobalFunction.getFeatureOptionCost(element.IDfo ,element.IDiska)
                        }
                    });

                    // data = _.sortBy(data, function(value){
                    //     value.fgName
                    // })

                    // Object.fromEntries(Object.entries(data).sort())

                    data = _.groupBy(data, function(value){
                        if(value.fgName != null){
                            return value.fgName
                        }
                        if(value.foName != null){
                            return value.foName
                        }
                    });
                    // console.log(data);
                    // data = _.sortBy(data, function(value) {
                    //     return value.fgName;
                    // });
                    // console.log(data);
      

                    // let QuantityDiscount = await getQuantityDiscount(IDiska)
                    resolve({status : 'success' , data:data })      
            })
    })
}


const GetFeatureOptionsGroupByIDiska = async function(AllIDiska){  
    return new Promise((resolve, reject) => {

        if(!AllIDiska){
            resolve({status : "err" , Details : 'err 2017'})
            return
        }
        strAllIDiska = ""
        AllIDiska.forEach(element => {
            strAllIDiska +=  element.IDiska + ','
        });
        strAllIDiska = strAllIDiska.slice(0,-1)
        console.log(strAllIDiska);
        let sql =   `SELECT fo.IDfo, fo.foName, fo.IDfg, fg.fgName, fopi.foPrice, fopi.isPrecentage, iskaot.iskaName, iskaot.IDiska,iskaot.minimumTicketsPerOrder,iskaot.maximumTicketsPerRound FROM featureOptionsPerIska as fopi LEFT JOIN featureOptions as fo ON (fopi.IDfo=fo.IDfo) LEFT JOIN featureGroups as fg ON (fo.IDfg=fg.IDfg) LEFT JOIN iskaot ON (iskaot.IDiska=fopi.IDiska) WHERE fopi.IDiska IN(`+strAllIDiska+`) AND fopi.foInventory > 0  ORDER BY fg.fgName, fo.foName`
        
        Pool.query(sql, async(err, row ,fields) => {
            // console.log(err, row);
            row = _.groupBy(row, function(value){
                return value.IDiska
            });
 
            data = []
            await Object.keys(row).forEachAsync(async(IDiska) => {
                //לטפל גם במצב שמגיע IDiska בלי אפשרויות למוצר
                console.log(IDiska);
                let idx = await AllIDiska.findIndex(async(x) => x.IDiska == IDiska);
                let IDinlay = AllIDiska[idx].IDinlay
                let maximumTicketsPerRound = await GlobalFunction.getInlayMaxAvailableTickets(IDinlay)
                let minimumTicketsPerOrder = await GlobalFunction.getMinimumForOrder(IDinlay)
                let iskaName = row[IDiska][0].iskaName

                data.push({IDiska:IDiska , iskaName:iskaName , minimumTicketsPerOrder:minimumTicketsPerOrder, maximumTicketsPerRound:maximumTicketsPerRound ,featureOptions:[]})
                await row[IDiska].forEachAsync(async(element) => {
                    if(element.fgName!= null && element.fgName != ""){
                        if(element.isPrecentage){
                            element.foPrice = await GlobalFunction.getFeatureOptionCost(element.IDfo ,element.IDiska)
                        }
                        let dataidx = data.findIndex(x => x.IDiska == element.IDiska);
                        if(dataidx != -1){
                            data[dataidx].featureOptions.push(element)
                        }
                    }
                })
                
                let newIdx = data.findIndex(x => x.IDiska == IDiska);
                data[newIdx].featureOptions = _.groupBy(data[newIdx].featureOptions, function(value){
                    return value.fgName
                });
                
            });
            // console.log(data);
            resolve({data:data})
         
            
        })
        
    })
}




const getiskaPickupBranches = async function(iskaPickupBranches , IDsapak){  
   
        return new Promise((resolve, reject) => {
            if(!iskaPickupBranches){
                resolve([])
                return
            }
            Pool.query('SELECT IDbranch,branchName FROM `sapakBranches` WHERE IDbranch IN ('+iskaPickupBranches+') AND IDsapak = (?);',[IDsapak], async(err, rows ,fields) => {
                if (err){
                    console.log(err);
                    return reject(err);
                } 
                resolve(rows)
            })
        })
}

const getDeliveryDetails = async function(IDiska){  
        return new Promise((resolve, reject) => {
            Pool.query('SELECT IDsapak,iskaPickupBranches,iskaFreeShipment,iskaShipments,iskaCurrency FROM iskaot WHERE IDiska = (?);',[IDiska], async(err, row ,fields) => {
                if (err){
                    console.log(err);
                    return reject(err);
                } 
                if(row.length > 0){
                    let IDsapak = row[0].IDsapak
                    let IskaShipments = row[0].iskaShipments
                    let iskaCurrency = row[0].iskaCurrency
                    let data = {
                        iskaFreeShipment : row[0].iskaFreeShipment,
                        iskaPickupBranches : await getiskaPickupBranches(row[0].iskaPickupBranches,IDsapak),
                        iskaShipments:''
                    }    
         
                    Pool.query('SELECT IDshipment,shipmentName,shipmentPrice FROM `shipments` WHERE IDshipment IN ('+IskaShipments+') AND IDsapak = (?);',[IDsapak], async(err, shipmentRows ,fields) => {
                        if (err) return reject(err);
                        shipmentRows.forEach(element => {
                            element.iskaCurrency = iskaCurrency
                        });
                        data.iskaShipments = shipmentRows
                        resolve({status : 'success' , data:data})
                    })
                }else{
                    resolve({status : 'success' , data:[]})

                }

            })
    })
}

const getValidShippingAddress = async function(allIDiska,orderShipmentCity){  
    console.log(allIDiska,orderShipmentCity);
    return new Promise((resolve, reject) => {
        console.log(allIDiska);
        if(!allIDiska){
            resolve({data : false})
            return
        }
        if (allIDiska[allIDiska.length-1] === ",") {
            allIDiska = allIDiska.slice(0, -1)
        }

        // let iskaFreeShipment = GlobalFunction.getFields('iskaot','iskaFreeShipment',"WHERE IDiska IN ('"+allIDiska+"')'")
        // if(iskaFreeShipment != 'notFound'){
        //     console.log('iskaFreeShipment12341' , iskaFreeShipment);
        //     if(iskaFreeShipment.find(el=> el.iskaFreeShipment===1) !== undefined) 
        //         resolve({data : true})
        //         return
        // }


        Pool.query('SELECT iskaBranches FROM iskaot WHERE IDiska IN ('+allIDiska+')', async(err, Row ,fields) => {
            if (err){
                console.log(err);
                return reject(err);
            } 
            // console.log(Row);
            let iskaBranches = ""
            let isValidCity = false
            Row.forEach(element => {
                if(element.iskaBranches)
                    iskaBranches+= element.iskaBranches + ','
                // console.log(element.iskaBranches , element.iskaBranches.includes(orderShipmentCity));
            });
            if (iskaBranches[iskaBranches.length-1] === ",") {
                iskaBranches = iskaBranches.slice(0, -1)
            }
            if(iskaBranches == ''){
                resolve({data : false})
                return
            }            
            Pool.query('SELECT branchAreaCover FROM sapakBranches WHERE IDbranch IN (' +iskaBranches+ ')', async(err, Row2 ,fields) => {
                if (err){
                    console.log(err);
                    return reject(err);
                }
                // console.log(Row2);
                Row2.forEach(element2 => {
                   
                    if(element2.branchAreaCover && element2.branchAreaCover.includes(orderShipmentCity)){
                        isValidCity = true
                    }
                });

                resolve({data : isValidCity})
            })
            
            // Row.forEach(element => {
            //     console.log(element.iskaBranches , element.iskaBranches.includes(orderShipmentCity));
            // });
            // console.log(isValidCity);
        })
        

        
    })
    
    



    
    let res1 = new Promise((resolve, reject) => {
        Pool.query('SELECT iskaBranches FROM iskaot WHERE IDiska = (?)',[IDiska], async(err, Row ,fields) => {
            if (err) return reject(err);
            if(Row.length > 0){
                resolve(Row[0].iskaBranches)
            }else{
                resolve('notFound')
            }
        })
    })

    // return new Promise(async(resolve, reject) => {
    //     let iskaBranches = await res1
    //     if(iskaBranches != 'notFound'){
    //         console.log(iskaBranches);
    //         Pool.query('SELECT branchAreaCover FROM sapakBranches WHERE IDbranch IN (' +iskaBranches+ ')', async(err, Row ,fields) => {
    //             if (err) return reject(err);
    //             let branchAreaCover = ""
    //             Row.forEach(element => {
    //                 element.branchAreaCover = JSON.parse(element.branchAreaCover)
    //                 element.branchAreaCover.forEach(branch => {
    //                     branchAreaCover += branch + ','
    //                 });
    //             });
    //             console.log(Row);
    //             branchAreaCover = branchAreaCover.slice(0, -1)             
    //             if(Row.length > 0){
    //                 Pool.query('SELECT cityName_HE,cityCode FROM `cities` WHERE cityCode IN (' +branchAreaCover+ ')', async(err, Row ,fields) => {
    //                     resolve({status : 'success' , data : Row})
    //                 })
    //             }else{
    //                 resolve({status : 'err 7001' , details : 'not found result'})
    //             }
    //         })
    //     }else{
    //         resolve({status : 'err 7002' , details : 'not found result'})
    //     }
    // })
    // // arr = [1 , 2 , 3]
    // // await arr.forEachAsync(async(element) => {
    // //    console.log();
    // //    console.log(await res2);
    // // })

    

}

const SendUserVerificationCode = async function(Pickup){  
    return new Promise(async(resolve, reject) => {
        console.log('Pickup' , Pickup);
       let res = await GlobalFunction.SendVerificationCode(Pickup.customerFirstName ,Pickup.customerPhoneNumber)
       if(res){
            resolve({status : "success"})
       }else{
            resolve({status : "err"})
       }
    })
}
 

const UserVerificationCode = async function(Pickup){
     
    return new Promise(async (resolve, reject) => {
        Pool.query('SELECT cusFirstNameToUpdate FROM SMScodes WHERE mobileCode = (?) AND mobileNumber = (?) AND codeExpires>=NOW();',[Pickup.mobileCode , Pickup.customerPhoneNumber],async (err, row ,fields) => {
            if (err) return reject(err);
                // console.log(row);
                if(row.length>0){
                    let IDcustomer = ''
                    rs = await GlobalFunction.getFields('customers','IDcustomer','WHERE customerPhoneNumber='+Pickup.customerPhoneNumber)
                    if(rs != 'notFound'){
                        IDcustomer =  rs[0].IDcustomer
                    }else{
                        IDcustomer = await GlobalFunction.getRandNumber(6,'customers','IDcustomer',false)
                    }
                    Pickup.mobileCode = ''
                    let data = {IDcustomer:IDcustomer,Pickup:Pickup}
                    let UserToken = await GlobalFunction.grantToken(data)
                    resolve({status : "success" , Verification : true , IDcustomer:IDcustomer , UserToken:UserToken})
                    Pool.query('DELETE FROM SMScodes WHERE mobileNumber = (?);',[Pickup.customerPhoneNumber],(err, row ,fields) => {})
                }else{
                    // אימות לא הצליח
                    resolve({status : "success" , Verification : false})
                }
         
        })
    })
}
 



const validateCouponViaServer = async function(IDiska,orderCoupon){
    console.log(IDiska,orderCoupon);
    return new Promise(async (resolve, reject) => {
        Pool.query('SELECT CouponDiscount FROM `coupons` WHERE IDiska = (?) AND CouponCode = (?) AND couponCounter < couponMaxUsage;',[IDiska,orderCoupon],async (err, row ,fields) => {
            if (err) {
                console.log(err);
                reject(err);
                return 
            }
                // console.log(row);
                if(row.length>0){
                    resolve({status : "success" , CouponDiscount:row[0].CouponDiscount})
                }else{
                    resolve({status : "err" , Details : 'No coupon available'})
                }
         
        })
    })
}
 

const getAllUpSaleByIDiska = async function(allIDiska){
    return new Promise(async (resolve, reject) => {
        console.log('allIDiska' , allIDiska);
        if(!allIDiska){
            resolve({status : "err" , Details : 'err 2000'})
            return
        }
        allIDiska = allIDiska.slice(0,-1)

        let sql = `
                    SELECT
                    upS.IDupsale,upS.upsaleName,upS.upsalePhoto,upS.upsalePrice,upS.upsaleInventory,
                    isk.IDiska ,isk.iskaName , isk.iskaCurrency , isk.IDsapak
                    FROM upSales as upS 
                    LEFT JOIN iskaot as isk ON FIND_IN_SET(upS.IDupsale, isk.iskaUpsales)
                    WHERE isk.IDiska IN(`+allIDiska+`) AND upS.upsaleInventory > 0
                    `
                    console.log(sql);
        Pool.query(sql,[],async (err, row ,fields) => {
            if (err) {
                console.log(err);
                reject(err);
                return 
            }
            row.forEach((item, index, object) => {
                item.upsalePhoto = '/uploads/users/' + item.IDsapak + '/upsale/' + item.upsalePhoto
                item.upsalePrice = (item.upsalePrice).toFixed(2)
            });


            if(row.length>0){
                resolve({status : "success" , data:row})
            }else{
                resolve({status : "err" , Details : 'No UpSales available'})
            }
         
        })
    })
}


const getBasicIskaPriceWithEqualizer = async function(IDiska,IDinlay,ticketType){
    return new Promise(async (resolve, reject) => {

        let rs2 = await GlobalFunction.getFields('iskaot','basicIskaPrice','WHERE IDiska='+IDiska )
        if(rs2 == 'notFound'){
            resolve('notFound')
            return
        }
        let basicIskaPrice = rs2[0].basicIskaPrice
        
        if(!IDiska || !IDinlay){
            resolve(basicIskaPrice)
            return
        }

        let demandHistory =  await GlobalFunction.getFields('demandHistory','weekDay,timeFrame,calculatedFactor','WHERE IDiska='+IDiska + ' order by weekDay , timeFrame')
        if(demandHistory == 'notFound'){
            resolve(basicIskaPrice)
            return
        }
        
        demandHistory = JSON.stringify(demandHistory)
        demandHistory = JSON.parse(demandHistory)
        
        let rs = await GlobalFunction.getFields('inlays','inlaySchedule','WHERE IDiska='+IDiska + ' AND IDinlay = '+IDinlay )
        if(rs == 'notFound'){
            resolve(basicIskaPrice)
            return
        }
        
        let inlaySchedule = rs[0].inlaySchedule
        
        let ils = new Date (inlaySchedule)
        let weekDay = parseInt(ils.getDay()) + 1
        let timeFrame = ils.getHours()
        
        let demand = _.find(demandHistory, function(x){
            return x.weekDay == weekDay && x.timeFrame == timeFrame
        });
        
        let calculatedFactor = 1
        if(demand && demand.calculatedFactor){
            calculatedFactor = demand.calculatedFactor
        }
        basicIskaPrice = (calculatedFactor * basicIskaPrice).toFixed(2) 


        resolve(basicIskaPrice)
        
    })
}



const getAllinlayByIdIskaAndIDinlay = async function(IDiska,IDinlay){
    return new Promise(async (resolve, reject) => {
        Pool.query('SELECT inlaySchedule FROM inlays where IDiska = (?) AND IDinlay = (?)',[IDiska,IDinlay],async (err, row ,fields) => {
            if (err) {
                console.log(err);
                reject(err);
                return 
            }
                let inlaySchedule
                let DaysCount = 14
                if(row.length>0){
                    inlaySchedule = format(new Date(row[0].inlaySchedule), "yyyy-MM-dd 00:00:00")   
                }else{
                    inlaySchedule = format(new Date(Date.now()), "yyyy-MM-dd 00:00:00")      
                }
                let toDate = addDays(new Date(inlaySchedule), DaysCount)
                // let sql = "SELECT inl.IDinlay,inl.inlaySchedule,isk.iskaCurrency,isk.basicIskaPrice FROM `inlays` as inl LEFT JOIN iskaot as isk ON (inl.IDIska=isk.IDiska) WHERE inl.IDIska = (?) and inl.inlaySchedule >= (?) and inl.inlaySchedule <= (?) AND inl.isActive = 1 AND isk.isActive = 1 and inl.isBrake = 0 order by inlaySchedule"
                let sql = "SELECT inl.IDinlay,inl.inlaySchedule,isk.iskaCurrency,isk.basicIskaPrice,isk.iskaType FROM `inlays` as inl LEFT JOIN iskaot as isk ON (inl.IDIska=isk.IDiska) WHERE inl.IDIska = (?) and inl.inlaySchedule >= (?) and inl.inlaySchedule <= (?) AND inl.isActive = 1 AND isk.isActive = 1 and inl.isBrake = 0 GROUP BY inl.inlaySchedule ORDER BY inl.inlaySchedule"
                
                console.log(IDiska,inlaySchedule,toDate);
                Pool.query(sql,[IDiska,inlaySchedule,toDate],async (err, inlayRows ,fields) => {
                    if (err) {
                        console.log(err);
                        reject(err);
                        return 
                    }
                    // if(inlayRows.length>0){
                        // console.log(inlayRows);

                        let equalizerInlay = []
                        //let cheapestPrice = 10000000
                        for (let i = 0; i < DaysCount; i++) {
                            let day = addDays(new Date(inlaySchedule), i)
                            // let cheapestPrice
                            day = format(new Date(day), "yyyy-MM-dd")
                            // let iskaCurrency
                            //let cheapestPrice
                            Inlay = inlayRows.filter(item => {
                                // console.log(item)
                                // iskaCurrency = item.iskaCurrency
                                //item.basicIskaPrice = item.basicIskaPrice * getDemandFactor(IDiska, inlaySchedule) // -- מחיר הכרטיס להצגה שווה למחיר הבסיסי של הכרטיס כפול הפקטור מטבלת היצע וביקוש --
                                // if (parseFloat(item.basicIskaPrice)<parseFloat(cheapestPrice)) { cheapestPrice = item.basicIskaPrice }
                                // cheapestPrice = item.basicIskaPrice
                                return format(new Date( item.inlaySchedule), "yyyy-MM-dd") == day
                            })
                            equalizerInlay.push({ day: day, Inlay: Inlay })
                        } 
                         
                        let demandHistory =  await GlobalFunction.getFields('demandHistory','weekDay,timeFrame,calculatedFactor','WHERE IDiska='+IDiska + ' order by weekDay , timeFrame')
                        demandHistory = JSON.stringify(demandHistory)
                        demandHistory = JSON.parse(demandHistory)

                        // console.log(demandHistory);
                        // console.time('getDemandFactor')
                        await equalizerInlay.forEachAsync(async(day)=>{
                            day.cheapestPrice = 10000000
                            await day.Inlay.forEachAsync(async(element)=>{
                                day.iskaCurrency = element.iskaCurrency

                                console.log(element.inlaySchedule);
                                let maximumTicketsPerRound = await GlobalFunction.getInlayMaxAvailableTickets(element.IDinlay)
                     
                                if(maximumTicketsPerRound <= 0){
                                    element.notInStock = true
                                }
                    
                                
                                let ils = new Date (element.inlaySchedule)
                                let weekDay = parseInt(ils.getDay()) + 1
                                let timeFrame = ils.getHours()
                                // console.log(weekDay , timeFrame);
                                let demand = _.find(demandHistory, function(x){
                                    return x.weekDay == weekDay && x.timeFrame == timeFrame
                                });
                                let calculatedFactor = 1
                                if(demand && demand.calculatedFactor){
                                    calculatedFactor = demand.calculatedFactor
                                }

                                let factorizedIskaPrice = element.basicIskaPrice * calculatedFactor
                                // let factorizedIskaPrice = element.basicIskaPrice *  await getDemandFactor(IDiska, element.inlaySchedule)
                                
                                if(day.cheapestPrice > factorizedIskaPrice){ day.cheapestPrice = factorizedIskaPrice.toFixed(2) }   // מעדכן את המחיר הזול לאותו יום
                                element.basicIskaPrice = factorizedIskaPrice
                                element.calculatedFactor = calculatedFactor //+ (Math.random() * (0.00 - 1.20) + 1.20).toFixed(2)

                             
                             

                            })

                            // console.log(day.cheapestPrice);
                        })
                        // console.timeEnd('getDemandFactor')

                        resolve({status : "success" , data:equalizerInlay})
              
                    // }
                    // else{
                    //     resolve({status : "err" , Details : 'No inlay available'})
                    // }
                })
        })
        
    })
}


async function getDemandFactor(IDiska, inlaySchedule) {
    return new Promise(async(resolve, reject) => {
        let gdf = 1
        let ils = new Date (inlaySchedule)
        let weekDay = parseInt(ils.getDay()) + 1
        let timeFrame = ils.getHours()
        // console.log('getDemandFactor sql query');
        rs =  await GlobalFunction.getFields('demandHistory','calculatedFactor','WHERE IDiska='+IDiska+' AND weekDay='+weekDay+' AND timeFrame='+timeFrame+' LIMIT 1')
        if (rs!='notFound') { 
            if (rs[0].calculatedFactor==null) 
                { gdf = 1 }
            else
                { gdf = rs[0].calculatedFactor }
        }
        resolve(gdf)
    })
}



function countOccurrence(IDiska, i2c, c2c, ofoIDfo) {
    let newValue = true
    let ixx = 0
    //console.log('IDiska='+IDiska, 'ofoIDfo.length='+ofoIDfo.length)
    for(tmpii=0; tmpii<ofoIDfo.length; tmpii++) {
        if (i2c==ofoIDfo[tmpii][0]) {
            newValue = false
            ofoIDfo[tmpii][1]++
            ofoIDfo[tmpii][2] = ofoIDfo[tmpii][2] + c2c
            tmpii = ofoIDfo.length + 1
        }
    }
    if (newValue) { ofoIDfo.push([i2c, 1, c2c]) }
    return ofoIDfo
}




const AddOrder = async function(myCart,ipAddress,pLang,IDcusto,Pickup){



    // await AddOrderHelper.AddOrder(myCart)
    // return

    // IDcustomer = IDcus
    // req.IDcustomer,req.Pickup   
    myCart.IDcustomer = IDcusto
    myCart.Pickup = Pickup
    
    return new Promise(async (resolve, reject) => {
        // myCart.IDcustomer = myIDcustomer
        // console.log('myCart.IDcustomer' , myCart.IDcustomer);
        // return
        // return
        // let xxx = await getOrderDetailsForPP10(718616)
        // resolve(xxx)
        // return

        // // ==== DEBUG === ***FIX-ME*** ======
        // console.log('עוצר כאן בכוונה את הקוד ***FIX-ME***')
        // resolve('עוצר כאן בכוונה את הקוד ***FIX-ME***')
        // return
        // // ==== DEBUG === ***FIX-ME*** ======



        // -- DEBUG use: --
        //let ccc= await getOrderDetailsForPP10(662449, 783562)
        //console.log()
        // resolve(ccc)
        // return
        // -- DEBUG end --

        //console.log('start running AddOrder function');
        console.log('got params:' , myCart);
        
        // pp9 – ביצוע ההזמנה בפועל והצגת סיכום הזמנה או דף בקרת ההזמנה, עבור ס.ע מוצר\מזון + אטרקציה + בעלי מקצוע\מסעדה + מכרז
        
        /*
        שדות שמתקבלים ממסך קודם pp8
        ccNumber
        ccExpiration
        ccIDnumber
        ccCVV
        IDcustomer - אם לקוח קיים שהגיע מקישור אישי
        iskaType - סוג העסקה, אפשרויות: attraction, product-food, professionals, auction
        orderType - אופן ביצוע העסקה, אפשרויות: משלם על הכל, משתתף עם חברים , מארגן קבוצה, תשלום יחסי, רכישה קבוצתית
        orderIsPrimary - true or false - זוהי הזמנה ראשונית, אחרת משנית
        */

        let orderIsPrimary = myCart.orderIsPrimary      // -- סימון אם ההזמנה היא ראשונית, אחרת זוהי הזמנה משנית --
        if (orderIsPrimary!=true && orderIsPrimary!=false) { orderIsPrimary = true }
        
        let IDbranch

        //  if(myCart.iskaType == 'professionals' && !orderIsPrimary){
        //      if (myCart.CartProfessionals[0].IDbranch) { IDbranch = myCart.CartProfessionals[0].IDbranch } else { IDbranch = 0 }
        //  }else if(myCart.iskaType == 'product-food' && !orderIsPrimary){
        //      if (myCart.CartProductFood[0].IDbranch && !orderIsPrimary) { IDbranch = myCart.CartProductFood[0].IDbranch } else { IDbranch = 0 }
        //  }else if(myCart.iskaType == 'attraction' && !orderIsPrimary){
        //      if (myCart.CartAttraction[0].IDbranch) { IDbranch = myCart.CartAttraction[0].IDbranch } else { IDbranch = 0 }
        //  }
        //  else{
        //      if (myCart.CartActualOrder[0].IDbranch) { IDbranch = myCart.CartActualOrder[0].IDbranch } else { IDbranch = 0 }
        //     }
            
        if(orderIsPrimary){
             if (myCart.CartActualOrder[0].IDbranch) { IDbranch = myCart.CartActualOrder[0].IDbranch } else { IDbranch = 0 }
        }else{
            IDbranch = await GlobalFunction.getFields('orders','IDbranch',"WHERE IDorder = '" +myCart.IDorder+ "'")
            if(IDbranch != 'notFound'){
                IDbranch = IDbranch[0].IDbranch
            }else{
                IDbranch = 0
            }
        }

     
        if(IDbranch == 0){
            tempIdsapak = await GlobalFunction.getFields('iskaot','IDsapak', "WHERE IDiska = '" + myCart.CartActualOrder[0].IDiska + "'")
            if(tempIdsapak != 'notFound')
            tempIdsapak = tempIdsapak[0].IDsapak
            
            IDbranch = await GlobalFunction.getFields('sapakBranches','IDbranch', "WHERE IDsapak = '" + tempIdsapak + "' ORDER BY IDbranch ASC LIMIT 1")
            if(IDbranch != 'notFound')
            IDbranch = IDbranch[0].IDbranch
        }
        


        //myCart.IDcustomer = 356868      // שדה מוצב ***FIX-ME*****ידנית באופן זמני***FIX-ME***** מספר לקוח שהוקצה בתהליך ההזמנה
        let paymentReference2 = ''      // ניתן להגדיר פה אסמכתא או פרמטר אחר, משתנה זה נשמר לרשומת התשלום

        let IDorder                     = myCart.IDorder
        if (isNaN(IDorder)) { IDorder=await GlobalFunction.getRandNumber(6,'orders','IDorder',false) }
        
        let orderType = myCart.orderType
        if (!orderType) { 
            rs = await GlobalFunction.getFields('orders','orderType','WHERE IDorder='+IDorder+' LIMIT 1')
            if (rs=='notFound') {  orderType = 'משלם על הכל' } else { orderType=rs[0].orderType }
        }
        if (orderType!='משלם על הכל' && orderType!='משתתף עם חברים' && orderType!='מארגן קבוצה' && orderType!='תשלום יחסי' && orderType!='רכישה קבוצתית') { orderType = 'משלם על הכל'}
        
        // בודק שפרטי כרטיס אשראי של המזמין נתקבלו, אם לא זה אומר שהגיע מ pp10-קישור אישי וניקח פרטי כרטיס שלו מתשלום אחרון שביצע במערכת
        let ccNumber
        let ccExpiration
        let ccIDnumber
        let ccCVV  
        if(myCart.ccNumber!='' && myCart.ccExpiration!='' && myCart.ccIDnumber!='' && myCart.ccCVV!=''){
           // המזמין הזין פרטי כרטיס אשראי ב pp7
            ccNumber        = myCart.ccNumber
            ccExpiration    = myCart.ccExpiration
            ccIDnumber      = myCart.ccIDnumber
            ccCVV           = myCart.ccCVV
        } else {
            // זהו מזמין שהגיע מקישור אישי ויש לשלוף את פרטי כרטיס האשראי שלו
            rs = await GlobalFunction.getFields('payments','ccNumber, ccExpiration, ccIDnumber, ccCVV',"WHERE IDcustomer='"+myCart.IDCustomer+"' AND (paymentStatus=0 OR paymentStatus=1) ORDER BY paymentDate DESC LIMIT 1")
            if (rs!='notFound') {
                ccNumber        = cryptr.decrypt(rs[0].ccNumber)
                ccExpiration    = cryptr.decrypt(rs[0].ccExpiration)
                ccIDnumber      = cryptr.decrypt(rs[0].ccIDnumber)
                ccCVV           = cryptr.decrypt(rs[0].ccCVV)    
            } else { 
                 resolve({status:'err' , details:'err 9001'})    // לא מצאנו פרטי כרטיס אשראי של לקוח חוזר - לא אמור לקרות דבר כזה
                // == שלומי == להחזיר את המזמין אל מסך קליטת כרטיס אשראי מהמזמין pp7 ==
                return  // כרגע זורק החוצה אין איך להמשיך..
            }
        }

        // ישלוף את שם המסוף (טרנזילה) לביצוע החיוב של הסניף IDbrach שאליו שוייכה ההזמנה
        let branchCCterminal = ''
        rs = await GlobalFunction.getFields('sapakBranches','branchCCterminal','WHERE IDbranch='+IDbranch+' LIMIT 1')
        if (rs=='notFound') { branchCCterminal='captain' } else { branchCCterminal=rs[0].branchCCterminal }
        // ***FIX-ME*** חסרה לנו סיסמא של מסוף הטרנזילה, אין שדה כזה בממשק הניהול - כרגע שולח כל העסקאות במסוף קפטן של האתר ***FIX-ME***
        //console.log('branchCCterminal=' , branchCCterminal);
        
        // שולף כל הכרטיסים\מוצרים מסל הקניות - גם במצב של עסקה בודדת ללא סל קניות
        // let tmpArridx = 0
        let orderTicketsTotalArr = []
        let orderTicketsPaidArr = []
        let orderFeatureOptionsArr = []
        let orderFeatureOptionsPaidArr = []
        let orderShipmentArr = []
        let ottIDiska = ''
        let ottIDinlay = 0
        // let ottQuantity = 0
        // let ottCost = 0
        // let otpQuantity = 0
        // let otpCost = 0
        var ofoIDfo = []
        let iskaCurrency = myCart.iskaCurrency
        let iskaType = myCart.iskaType
        let NumberOfParticipants = ''
        let IPayCount = ''
        let orderBidPrice = ''

        // לשים לב שבהזמנה משנית סל הקניות CartProfessionals יכלול את מספר הכרטיסים ששולמ ובהזמנה בלבד, אין צורך לשלוח את כל הכרטיסים\מוצרים של הזמנת האב הראשית
        // כך תשמר התאימות בגודל של שני המערכים orderTicketsTotalArr , orderTicketsPaidArr - חשוב לפעולה תקינה של הקוד בהמשך
        
        console.log('handling iskaType -> ' + myCart.iskaType , 'with orderType of -> ' + orderType)
        
        if (iskaCurrency=='' || iskaCurrency==null) { iskaCurrency = 'ils' }
        
        if (!myCart.orderIsPrimary) {
            
            console.log('as received myCart.CartActualOrder for this secondary order -> '+ myCart.CartActualOrder)
            // ***FIX-ME***
            //return
            
            
            // --- יצירת CartActualOrder במצב בו מגיעים בהזמנה משנית, הנתונים נדרשים להמשך הפונקציה , בהזמנה ראשית מגיעים נתונים אלה ---
            //mySQL = "SELECT * FROM orders WHERE IDorder='"+myCart.IDorder+"' AND IDsubOrder='1' ORDER BY idx"
            //await Pool.query("SELECT * FROM orders WHERE IDorder='"+myCart.IDorder+"' AND IDsubOrder='1' ORDER BY idx", async (err, rs ,fields) => {
                
            let orderShipmentType = null
            let orderShipment = null
            if (myCart.orderType=='רכישה קבוצתית') {
                // --- שמירת נתוני המשלוח שבחר כל מזמין ברכישה קבוצתית, גם בהזמנות משנה בוחרים משלוח, לוקח רק של העסקה הראשונה כי בקבוצתית תמיד תהיה רק עסקה אחת בסל ---
                orderShipmentType = myCart.CartActualOrder[0].orderShipmentType
                orderShipment = myCart.CartActualOrder[0].orderShipment
            }
            
            myCart.CartActualOrder = []
            rs = await GlobalFunction.getFields('orders','*',"WHERE IDorder='"+myCart.IDorder+"' AND IDsubOrder='1' ORDER BY idx")
            if (rs!='notFound') { 

                //console.log(mySQL)
                if (rs.length>0) { 
                    //console.log('rs=',rs)
    
                    await rs.forEachAsync(async (element) => {

                        console.log('element.IDiska=',element.IDIska)

                        let TicketTypes = []
                        quantity = ''
                        basicIskaPrice = ''
                        console.log(element.orderTicketsTotal);
                        if (GlobalFunction.IsJsonString(element.orderTicketsTotal)) {
                            oua = JSON.parse(element.orderTicketsTotal)
                            if(iskaType!='attraction'){
                                quantity = parseInt(oua[0].quantity)
                                basicIskaPrice = parseFloat(parseFloat(oua[0].cost)/quantity).toFixed(2).toString() 
                                //for (tmpii=0; tmpii<oua.length; tmpii++) { InlayTotalTickets = InlayTotalTickets + parseInt(oua[tmpii].quantity) }
                            } else {
                                oua.forEach(element => {
                                    TicketTypes.push({
                                        IDticketType: element.ticketType,
                                        quantity: element.quantity,
                                        ttName: element.ttName,
                                        ttPrice: element.cost,
                                    })  
                                });
                            }
                        }
                        // console.log('TicketTypes = '+TicketTypes)
                        ofoTotal = []
                        extrasPrice = 0
                        if(iskaType!='attraction') {
                            if (GlobalFunction.IsJsonString(element.orderFeatureOptionsTotal)) {
                                oua = JSON.parse(element.orderFeatureOptionsTotal)
                                for (tmpii=0; tmpii<oua.length; tmpii++) {
                                    ofoTotal.push({'IDfo': oua[tmpii].IDfo})
                                    foCost = await GlobalFunction.getFeatureOptionCost(oua[tmpii].IDfo, element.IDIska)
                                    extrasPrice = extrasPrice + foCost
                                }
                            }
                        }
                            
                        // console.log('CartActualOrder' ,myCart.CartActualOrder);

                        await myCart.CartActualOrder.push({
                            IDiska: element.IDIska,
                            quantity: quantity,
                            basicIskaPrice: basicIskaPrice,
                            featureOptions: ofoTotal,
                            TicketTypes: TicketTypes,
                            extrasPrice: extrasPrice,
                            totalPrice: (parseFloat(parseFloat(basicIskaPrice)*quantity) + parseFloat(extrasPrice*quantity)).toFixed(2).toString(),
                            IDinlay: element.IDinlay,
                            orderShipmentType: orderShipmentType,
                            orderShipment: orderShipment,
                        })
                            //iskaCurrency: 'ils',
                            //iskaType: 'professionals',
                            //iskaUpsales: '29,30,31',
                            //myBid: null,

                    })
                } else {
                    console.log('ERROR! --> got bad IDorder number! cant create myCart.CartActualOrder array for secondary order!')
                }
            }


        }

        console.log('=========== myCart.CartActualOrder ===================')
        console.log('==============================')
        console.log(myCart.CartActualOrder)
        console.log('==============================')
        console.log('============ end of myCart.CartActualOrder ==================')
        // console.log(myCart.CartActualOrder[0].TicketTypes)
        // console.log(myCart.CartActualOrder[1].TicketTypes)
        //return


        // --- טיפול במכרז ---
        if (myCart.iskaType=='auction') {
                
            orderBidPrice = myCart.CartActualOrder[0].myBid
                rs = await GlobalFunction.getFields('iskaot','bidParticipateFee','WHERE IDiska='+myCart.CartActualOrder[0].IDiska+' LIMIT 1')
                // --- קבלת מחיר השתתפות במכרז ---
                if (rs!='notFound') { 
                    bidParticipateFee = rs[0].bidParticipateFee
                } else {
                    // -- אם לא מצא במסד לוקח ממה שנשלח מהקליינט, פחות טוב --
                    bidParticipateFee = myCart.CartActualOrder[0].bidParticipateFee
                }
                orderTicketsTotalArr.push([myCart.CartActualOrder[0].IDiska, 0, 1, (parseFloat(bidParticipateFee)).toFixed(2)])
                orderTicketsPaidArr.push([myCart.CartActualOrder[0].IDiska, 0, 1, (parseFloat(bidParticipateFee)).toFixed(2)])
                orderFeatureOptionsArr.push([myCart.CartActualOrder[0].IDiska, ''])
                orderFeatureOptionsPaidArr.push([myCart.CartActualOrder[0].IDiska, ''])

                 // --- שולף סוג משלוח ובונה מערך משלוחים ---
                 oShipDetails = await getShipmentDetails(myCart.CartActualOrder[0].orderShipmentType, myCart.CartActualOrder[0].orderShipment)
                 orderShipmentArr.push({
                     ottIDiska: myCart.CartActualOrder[0].IDiska,
                     ottIDinlay: 0, 
                     oShipDetails: oShipDetails,
                 })
                 console.log('oShipDetails=',oShipDetails, 'will push into shipments -> ', myCart.CartActualOrder[0].IDiska, 0, oShipDetails)
                
        }


        // --- טיפול בבעלי מקצוע ---
        if (myCart.iskaType=='professionals') {
            await myCart.CartActualOrder.forEachAsync(async(arrField,i) => { 
                
                // --- מספר הכרטיסים ששולמו בכל עסקה ---
                let IPayCount = _.where(myCart.CartProfessionals,{IPay:true, IDiska:arrField.IDiska}).length
                console.log('IPayCount='+IPayCount+',IDiska='+arrField.IDiska)
                
                // --- בונה מערך סהכ כמות הכרטיסים לכל עסקה ---
                basicIskaPrice = await getBasicIskaPriceWithEqualizer(arrField.IDiska,arrField.IDinlay)
           
                orderTicketsTotalArr.push([arrField.IDiska, arrField.IDinlay, arrField.quantity, (parseFloat(basicIskaPrice)*parseFloat(arrField.quantity)).toFixed(2)])
                
                // --- בונה מערך סהכ אפשרויות למוצר לכל עסקה + אפשרויות למוצר ששולמו לכל עסקה ---
                ofoTotal = []
                ofoPaid = []
                await arrField.featureOptions.forEachAsync(async(foField,i) => { 
                    if(!isNaN(foField.IDfo)){
                        foCost = parseFloat(await GlobalFunction.getFeatureOptionCost(foField.IDfo, arrField.IDiska))
                        ofoTotal.push([ foField.IDfo, arrField.quantity, parseFloat(foCost*arrField.quantity).toFixed(2) ])
                        ofoPaid.push([ foField.IDfo, IPayCount, (parseFloat(foCost)*parseFloat(IPayCount)).toFixed(2) ])
                    }
                })
                orderFeatureOptionsArr.push([arrField.IDiska,ofoTotal])
                orderFeatureOptionsPaidArr.push([arrField.IDiska,ofoPaid])
                
                // ---  בונה מערך כמות הכרטיסים ששולמו לכל עסקה ---
                orderTicketsPaidArr.push([arrField.IDiska, arrField.IDinlay, IPayCount, (parseFloat(basicIskaPrice)*IPayCount).toFixed(2)])
                
                // --- בונה מערך שאינו נדרש בסוג עסקה זה - משלוחים ---
                orderShipmentArr.push({
                    ottIDiska: arrField.IDiska,
                    ottIDinlay: arrField.IDinlay , 
                    oShipDetails: '',
                })
            })
        }

        
        // --- טיפול באטרקציה ---
        if (myCart.iskaType=='attraction') {
            
            // -- מספר הכרטיסים הכולל שיש בעסקה + מערך משלוחים ריק ---
            await myCart.CartActualOrder.forEachAsync(async(arrField,i) => { 
                let orderTotalTicketsForDB = []
                // array example: [{"ticketType":"5", "ttName":"חייל", "quantity":6, "cost":"660"},{"ticketType":"12", "ttName":"תלמיד", "quantity":1, "cost":"50"}] 
                await arrField.TicketTypes.forEachAsync(async(ttIDX,i) => { 
                    if (ttIDX.quantity>0) { orderTotalTicketsForDB.push({"ticketType":ttIDX.IDticketType, "ttName":ttIDX.ttName, "quantity":ttIDX.quantity, "cost":(parseFloat(ttIDX.ttPrice)*parseInt(ttIDX.quantity)).toFixed(2)}) }
                })

                // CartAttraction
                orderTicketsTotalArr.push([arrField.IDiska,arrField.IDinlay,orderTotalTicketsForDB])

                 // --- בונה מערך שאינו נדרש בסוג עסקה זה - משלוחים ---
                orderShipmentArr.push({ ottIDiska: arrField.IDiska, ottIDinlay: arrField.IDinlay, oShipDetails: ''})

            })
            
            // --- מספר הכרטיסים ששולמו בכל עסקה ---
            // ttARR = _.groupBy(myCart.CartAttraction, function(value){
                //     return value.IPay==true 
                // });
                // Object.keys(ttARR).forEach((ttIDX)=>{
                    //     ttARR[ttIDX].forEach((x)=>{
                        //         if (x.IPay==true) {
                            //             hasThisTT = _.findWhere(orderPaidTicketsForDB, {ticketType: x.IDticketType})
                            //             if (hasThisTT!=undefined) {
                                //                 console.log('found TT is already in array ' + x.IDticketType , hasThisTT)
                                //                 hasThisTT.quantity = hasThisTT.quantity + 1
                                //                 hasThisTT.cost = (parseInt(hasThisTT.quantity) * parseFloat(x.price)).toFixed(2)
                                //                 console.log('after edit ' +  JSON.stringify(hasThisTT))
                                //                 // orderPaidTicketsForDB
                                //             } else {
                                    //                 orderPaidTicketsForDB.push({"ticketType":x.IDticketType, "ttName":x.ttName, "quantity":1, "cost":x.price})
                                    //             }
                                    //         }
                                    //         // console.log(x.IDticketType, x.price, x.ttName, x.IPay);
                                    //     })
                                    // })
                                    
            let orderPaidTicketsForDB = []
            ttARR = _.groupBy(myCart.CartAttraction, function(value){
                return value.IDiska 
            });
            currentIDiska = 0
            currentIDinlay = 0
            Object.keys(ttARR).forEach((ttIDX)=>{
                ttARR[ttIDX].forEach((x)=>{
                    if (currentIDiska==0) { currentIDiska = x.IDiska; currentIDinlay = x.IDinlay }
                    if (currentIDiska!=x.IDiska) { 
                        orderTicketsPaidArr.push([currentIDiska, currentIDinlay, orderPaidTicketsForDB])
                        currentIDiska = x.IDiska
                        currentIDinlay = x.IDinlay
                        orderPaidTicketsForDB = []
                    }
                    if (x.IPay==true) {
                        hasThisTT = _.findWhere(orderPaidTicketsForDB, {IDiska: x.IDiska, ticketType: x.IDticketType})
                        if (hasThisTT!=undefined) {
                            console.log('found TT is already in array ' + x.IDticketType , hasThisTT)
                            hasThisTT.quantity = hasThisTT.quantity + 1
                            hasThisTT.cost = (parseInt(hasThisTT.quantity) * parseFloat(x.price)).toFixed(2)
                            console.log('after edit ' +  JSON.stringify(hasThisTT))
                            // orderPaidTicketsForDB
                        } else {
                            console.log(' ticketType:'+x.IDticketType, 'ttName:'+ x.ttName)
                            orderPaidTicketsForDB.push({IDiska: x.IDiska, ticketType:x.IDticketType, ttName: x.ttName, quantity:1, cost: x.price})
                        }
                    }
                    // console.log(x.IDticketType, x.price, x.ttName, x.IPay);
                })
            })
            
            if (currentIDiska!=0) { 
                orderTicketsPaidArr.push([currentIDiska, currentIDinlay, orderPaidTicketsForDB])
            }
            console.log('')
            console.log('orderTicketsPaidArr for attraction iska = '+JSON.stringify(orderTicketsPaidArr))
        }   
            

        // --- טיפול במוצר\מזון ---
        if (myCart.iskaType=='product-food') {
            console.log ('NumberOfParticipants='+NumberOfParticipants)
            await myCart.CartActualOrder.forEachAsync(async(arrField,i) => { 
                ottIDiska = arrField.IDiska
                ottIDinlay = 0
                if (!isNaN(ottIDiska) && ottIDiska!='') { 
                    
                    rs = await GlobalFunction.getFields('iskaot','basicIskaPrice, quantityDiscount','WHERE IDiska='+ottIDiska+' LIMIT 1')

                    // --- קביעת מחיר בסיס של המוצר ---
                    if (rs!='notFound') { 
                        basicIskaPrice = rs[0].basicIskaPrice
                    } else {
                        basicIskaPrice = arrField.basicIskaPrice    // -- זה לוקח ישר מהמערך שמתקבל מצד הלקוח פחות טוב, וגם יוצר בעיה עם כפל הנחת כמות בהמשך כי מגיע משם עם המחיר המוזל כבר אחרי הנחת הכמות
                        // -- אבל כרגע לא תיווצר כפילות הנחת כמות כי אם אין תוצאה ב rs אז ממילא לא תיבדק הנחת כמות בהמשך
                    }

                    // --- מספר מוצרים -בהזמנה ---
                    let totalQuantity = arrField.quantity
                    
                    // --- בדיקה אם יש הנחת כמות ועדכון מחיר המוצר בהתאם ---
                    //[{"quantity":"5","discount":"10"},{"quantity":"10","discount":"15"}]
                    console.log('basicIskaPrice before QD ='+basicIskaPrice)
                    if (rs!='notFound') { 
                        quantityDiscount = rs[0].quantityDiscount
                        if(GlobalFunction.IsJsonString(quantityDiscount) && quantityDiscount) {
                            quantityDiscount = JSON.parse(quantityDiscount)
                            qdQuantityAlreadyCalculated = 0
                            quantityDiscount.forEach((qdField,i) => { 
                                if (totalQuantity>=qdField.quantity && qdField.quantity>qdQuantityAlreadyCalculated ) {
                                    console.log('found quantity discount: q='+qdField.quantity+' d='+qdField.discount+'% , calculation basicIskaPrice='+ basicIskaPrice +'*(100-'+qdField.discount+')/100 = '+ basicIskaPrice * (100-qdField.discount)/100)
                                    basicIskaPrice = parseFloat((basicIskaPrice * (100-qdField.discount)/100).toFixed(2))
                                    qdQuantityAlreadyCalculated = qdField.quantity
                                }
                            })
                        }
                    }
                    console.log('basicIskaPrice after QD ='+basicIskaPrice)
                    
                    // --- מספר המשתתפים ---
                    NumberOfParticipants = myCart.CartProductFood.length
                    
                    // --- מספר החלקים ששילם --- 
                    IPayCount = _.where(myCart.CartProductFood,{IPay:true})
                    IPayCount = IPayCount.length
                    console.log('IPayCount='+IPayCount+',IDiska='+arrField.IDiska)

                    if (myCart.orderType=='משלם על הכל' ) { NumberOfParticipants = 1; IPayCount = 1 }

                    // --- מספר החלקים של המוצר ששילם בתלות במספר המוצרים בהזמנה ---
                    // let sumOfquantity = (IPayCount*totalQuantity).toString()+'/'+NumberOfParticipants.toString()
                    let sumOfquantity = await setFractionNumber(IPayCount*totalQuantity, NumberOfParticipants)

                    // --- שולף אפשרויות למוצר ובונה מערך אפשרויות למוצר ---
                    let ofoTotal = []
                    let ofoPaid = []
                    await arrField.featureOptions.forEachAsync(async(feature)=>{
                        if(!isNaN(feature.IDfo)){
                            console.log('FO => ' , arrField.IDiska, feature.IDfo, totalQuantity)
                            //let FeatureOptionCost = await GlobalFunction.getFeatureOptionCost(feature.IDfo ,ottIDiska)
                            //FeatureOptionQuantity = ((IPayCount * totalQuantity).toString()+'/'+NumberOfParticipants).toString()
                            //orderFeatureOptionsPaid.push({IDfo:feature.IDfo , quantity: FeatureOptionQuantity , cost: (FeatureOptionQuantity * FeatureOptionCost).toFixed(2)})
                            foCost = parseFloat(await GlobalFunction.getFeatureOptionCost(feature.IDfo, arrField.IDiska))
                            ofoTotal.push([ feature.IDfo, totalQuantity, (totalQuantity*foCost).toFixed(2) ])
                            ofoPaid.push([ feature.IDfo, await setFractionNumber(totalQuantity*IPayCount, NumberOfParticipants), (foCost*totalQuantity*IPayCount/NumberOfParticipants).toFixed(2) ])
                        }
                    })
                    orderFeatureOptionsArr.push([ottIDiska,ofoTotal])
                    orderFeatureOptionsPaidArr.push([ottIDiska,ofoPaid])
                    
                    orderTicketsTotalArr.push([ottIDiska,ottIDinlay,totalQuantity,(totalQuantity*basicIskaPrice).toFixed(2)]) 
                    orderTicketsPaidArr.push([ottIDiska,ottIDinlay,sumOfquantity,(eval(sumOfquantity) * parseFloat(basicIskaPrice)).toFixed(2)])
                    // orderTicketsPaid = [{"quantity":"מספר-מוצרים-בהזמנה *חלקי* מספר המשתתפים *כפול* מספר החלקים ששילם", "cost":"מה שיצא בכמות * עלות המוצר בסיס"}] < -- > מערך נראה ככה
                    // orderFeatureOptionsPaid = [{"IDfo":"44", "quantity":"מספר החלקים ששילם *כפול* כמות של אפשרות למוצר זו שיש בהזמנה *לחלק* במספר המשתתפים", "cost":"מה שיצא בכמות *כפול* עלות אחת של אפשרות למוצר"}] < -- > מערך נראה ככה
                    
                    // --- שולף סוג משלוח ובונה מערך משלוחים ---
                    oShipDetails = await getShipmentDetails(arrField.orderShipmentType, arrField.orderShipment)
                    orderShipmentArr.push({
                        ottIDiska: ottIDiska,
                        ottIDinlay: ottIDinlay, 
                        oShipDetails: oShipDetails,
                    })
                    console.log('oShipDetails=',oShipDetails, 'will push into shipments -> ',ottIDiska, ottIDinlay, oShipDetails)
                }
            })
        }

        console.log('\n')
        console.log ('NumberOfParticipants='+NumberOfParticipants)
        console.log('orderTicketsTotalArr='+JSON.stringify(orderTicketsTotalArr))
        console.log('orderTicketsTotalArr.length='+orderTicketsTotalArr.length)
        console.log('orderTicketsPaidArr='+JSON.stringify(orderTicketsPaidArr))
        console.log('orderTicketsPaidArr.length='+orderTicketsPaidArr.length)
        console.log('orderFeatureOptionsArr='+orderFeatureOptionsArr)    
        console.log('orderFeatureOptionsPaidArr='+orderFeatureOptionsPaidArr)    
        console.log('orderShipmentArr='+orderShipmentArr, ' == '+JSON.stringify(orderShipmentArr))    
        console.log('iskaCurrency='+iskaCurrency)    
        // console.log('ofoIDfo='+ofoIDfo, 'ofoIDfo.length='+ofoIDfo.length,'orderFeatureOptionsArr.length='+orderFeatureOptionsArr.length)    
        // console.log(orderTicketsPaid , orderFeatureOptionsPaid)
       
        // --- שולף סוג עסקה ע"פ עסקה ראשונה בהזמנה (בסל הקניות אם יש כזה) ---
        // iskaType options are: attraction, product-food, professionals, auction
        if (myCart.iskaType!='attraction') {
            rs = await GlobalFunction.getFields('iskaot','iskaType','WHERE IDiska='+orderTicketsPaidArr[0][0])
            if (rs!='notFound') { if (myCart.iskaType!=rs[0].iskaType) { console.log('#############################\n###  ERROR! got MISMATCH iskaType  ###\n###########################')} }
        }  
        console.log('iskaType='+iskaType)
        // ***FIX-ME***
        // return
        
        
        // --- סיכומי סכומים בהזמנה לפי נושא ---
        
        // חישוב הסכום שצריך לשלם המזמין עבור כרטיסים\מוצרים בלבד - ללא עלות של אפשרויות למוצר שסומנו ונבחרו
        console.log('orderTicketsPaidArr.length = '+orderTicketsPaidArr.length)
        let totalBasePayment = 0
        for(ii=0; ii<orderTicketsPaidArr.length; ii++) { 
            if (iskaType=='attraction') {
                // --- אטרקציה ---
                for(ii=0; ii<orderTicketsPaidArr.length; ii++) { 
                    for (zz=0; zz<orderTicketsPaidArr[ii][2].length; zz++) { totalBasePayment += parseFloat(orderTicketsPaidArr[ii][2][zz].cost) }
                }
            } else {
                // --- בעלי מקצוע + מוצר\מזון + מכרז ---
                totalBasePayment += parseFloat(orderTicketsPaidArr[ii][3]) 
            }
        }
        console.log('orderTicketsPaidArr[0][0]='+orderTicketsPaidArr[0][0], 'totalBasePayment='+totalBasePayment)
        
        // --- טיפול ובדיקה אפשרויות למוצר featureOptions ---
        let featureOptionsAmount = 0
        for(ii=0; ii<orderFeatureOptionsPaidArr.length; ii++) { 
            for (zz=0; zz<orderFeatureOptionsPaidArr[ii][1].length; zz++) {
                featureOptionsAmount += parseFloat(orderFeatureOptionsPaidArr[ii][1][zz][2])
             }
            }
         featureOptionsAmount = (featureOptionsAmount).toFixed(2)
         console.log('featureOptionsAmount = '+featureOptionsAmount)
         
         // --- טיפול ובדיקה קוד קופון ---
        let couponDiscountAmount = 0
        let couponDiscount = 0
        couponCounterSQL = ''
        if (myCart.orderCoupon && !isNaN(parseInt(myCart.orderCoupon))) {
            // הזינו קוד קופון
            
            // let allIDiska = ''
            // let couponDiscount = ''
            // for(ii=0; ii<orderTicketsPaidArr.length; ii++) {
                //     if (allIDiska!='') { allIDiska+=',' }
                //     allIDiska = allIDiska + orderTicketsPaidArr[ii][0]
                // }
                // מחשיב מספר עסקה ראשית לחישובים כמספר עסקה של הכרטיס הראשון שהגיע במערך CartProfessionals = orderTicketsPaidArr[0][0]
                //Pool.query("SELECT couponDiscount FROM coupons WHERE couponCode=(?) AND IDiska IN ("+allIDiska+") AND couponCounter<couponMaxUsage LIMIT 1",[myCart.orderCoupon],async (err, rs ,fields) => {
                    
                    rs = await GlobalFunction.getFields('coupons','couponDiscount','WHERE couponCode='+myCart.orderCoupon+' AND IDiska='+orderTicketsPaidArr[0][0]+' AND couponCounter<couponMaxUsage LIMIT 1')
                    if (rs=='notFound') {
                        myCart.orderCoupon = '' 
                    } else { 
                        couponDiscount = rs[0].couponDiscount
                        couponDiscountAmount = parseFloat((parseInt(couponDiscount)*(parseFloat(totalBasePayment)+parseFloat(featureOptionsAmount))/100)).toFixed(2)
                        couponCounterSQL = 'UPDATE coupons SET couponCounter=couponCounter+1 WHERE couponCode='+myCart.orderCoupon+' AND IDiska='+orderTicketsPaidArr[0][0] 
                    }
                }
                console.log('orderCoupon='+myCart.orderCoupon, 'couponDiscount='+couponDiscount+'%', 'couponDiscountAmount='+couponDiscountAmount)
                
                // --- טיפול ובדיקה הנחת שיתוף חברים ---
                let iskaFriendsShareDiscountAmount = 0
                let iskaFriendsShareDiscount = 0
                if (myCart.sharedIskaWithFriends) {
            // שיתפו עם חברים את העסקה - יש לתת הנחת שיתוף
            
            rs = await GlobalFunction.getFields('iskaot','iskaFriendsShareDiscount','WHERE IDiska='+orderTicketsPaidArr[0][0])
            if (rs=='notFound') { iskaFriendsShareDiscount = 0 } else { iskaFriendsShareDiscount = rs[0].iskaFriendsShareDiscount }

            iskaFriendsShareDiscountAmount = (parseFloat(iskaFriendsShareDiscount)*parseFloat((parseFloat(totalBasePayment)+parseFloat(featureOptionsAmount))/100)).toFixed(2)
        }
        console.log('iskaFriendsShareDiscount='+iskaFriendsShareDiscount+'%', 'iskaFriendsShareDiscountAmount='+iskaFriendsShareDiscountAmount)
        
        // --- טיפול ובדיקה מוצרים נלווים upsales ---
        let orderUpsalesAmount = 0
        let orderUpsalesArr = []
        ottIDiska = ''
        ofoIDfo = []
        myCart.orderUpsales.forEach((arrField,i) => { 
            orderUpsalesAmount = orderUpsalesAmount + parseFloat(arrField.cost)
            if (ottIDiska!=arrField.IDiska) {
                if (!isNaN.ottIDiska && ottIDiska!='') { orderUpsalesArr.push([ottIDiska,ofoIDfo]) }
                ottIDiska = arrField.IDiska
                ofoIDfo = []
                ofoIDfo.push(['{"IDupsale":"'+arrField.IDupsale+'","quantity":"'+arrField.quantity+'","cost":"'+arrField.cost+'"}'])                    
            } else {
                ofoIDfo.push(['{"IDupsale":"'+arrField.IDupsale+'","quantity":"'+arrField.quantity+'","cost":"'+arrField.cost+'"}'])                    
            }
        })
        orderUpsalesArr.push([ottIDiska,ofoIDfo])
        orderUpsalesAmount = orderUpsalesAmount.toFixed(2)
        console.log('orderUpsalesAmount='+orderUpsalesAmount)
        console.log('orderUpsalesArr before fixing = '+orderUpsalesArr)

        if (orderUpsalesArr.length<orderTicketsTotalArr.length) {
            // -- מערך אפסיילים קטן באורכו ממערך העסקאות שבסל, לא בחרו אפסייל אחד לפחות לכל עסקה, יש לתקן מערך אפסיילים --
            ii = 0
            newUpsalesArr = []
            for (jj=0; jj<orderTicketsTotalArr.length; jj++) { newUpsalesArr[jj] = '' }
            do {
                flagFU = false
                for (jj=0; jj<orderUpsalesArr.length; jj++) {
                    if (orderTicketsTotalArr[ii][0]==orderUpsalesArr[jj][0]) { flagFU = true; newUpsalesArr[ii] = orderUpsalesArr[jj]; jj = orderUpsalesArr.length }
                }
                if (!flagFU) { newUpsalesArr[ii] = [orderTicketsTotalArr[ii][0], ''] }
                ii++
            } while (ii<orderTicketsTotalArr.length)
            orderUpsalesArr = newUpsalesArr
        }
        console.log('orderUpsalesArr after fixing = '+orderUpsalesArr)
        
        // חישוב עלויות משלוחים של ההזמנה
        let totalshipmentAmount = 0
        for(ii=0; ii<orderShipmentArr.length; ii++) { 
            if(orderShipmentArr[ii].oShipDetails.cost) { 
                console.log('orderShipmentArr['+ii+'].oShipDetails.cost = ' + orderShipmentArr[ii].oShipDetails.cost)
                totalshipmentAmount += parseFloat(orderShipmentArr[ii].oShipDetails.cost)  
            }
        }
        if (iskaType=='auction') { totalshipmentAmount = 0 }
        console.log('totalshipmentAmount='+totalshipmentAmount)
        
        console.log('totalBasePayment=', parseFloat(totalBasePayment)  , 'orderUpsalesAmount=', parseFloat(orderUpsalesAmount) , 'featureOptionsAmount=', parseFloat(featureOptionsAmount) , 'totalshipmentAmount=', parseFloat(totalshipmentAmount) , 'couponDiscountAmount= -' , parseFloat(couponDiscountAmount) , 'iskaFriendsShareDiscountAmount= -', parseFloat(iskaFriendsShareDiscountAmount));
                
        totalAmountToCharge = parseFloat(totalBasePayment) - parseFloat(couponDiscountAmount) - parseFloat(iskaFriendsShareDiscountAmount) + parseFloat(orderUpsalesAmount) + parseFloat(featureOptionsAmount) + parseFloat(totalshipmentAmount)
        totalAmountToCharge = totalAmountToCharge.toFixed(2)
        console.log('totalAmountToCharge='+totalAmountToCharge)
           
        // ***FIX-ME***
        // return


        // מבצע חיוב J5 מול טרנזילה ויקבל את התשובה
        // [ tranzila J5 transaction here, returns ccReply=000 if all is good ]
        // --- tranzila currency options: 1=₪, 2=$, 3=£, 6=¥, 7=€ ---
        switch(iskaCurrency) {
            case 'ils': iskaCurrencyTranz = '1'; break;
            case 'usd': iskaCurrencyTranz = '2'; break;
            case 'eur': iskaCurrencyTranz = '7'; break;
            default:    iskaCurrencyTranz = '1';
        }
        // == שלומי == לשלוח פה פוסט אל טרנזילה עם כל השדות והמסוף המבוקש, זה הקוד מטופס קיים בטיקט הישן ==
        // -- סכום לחיוב totalAmountToCharge
        // -- מספר תשלומים iskaMaxPayments
        // -- מטבע של העסקה הראשונה בסל iskaCurrencyTranz
        // let ccReply = '000'      // תוצאת פעולת החיוב בכרטיס האשראי, ***FIX-ME***זמנית***FIX-ME*** מוגדר פה חיוב עבר בהצלחה
        // let ccTransID = '99999'  // מספר טרנזאקציה בטרנזילה, ***FIX-ME***זמנית***FIX-ME*** מוגדר פה ידנית

        /* לבדוק ולהחזיר לשימוש בטרנזילה בפרמטרים האלה:
        "&supplier=" & branchCCterminal
        "&TranzilaPW=" & CCterminalPass		' ---  נדרש מאחר ויש מסוף טוקנים --- '
        "&tranmode=V"	' --- מציין עסקת אימות J5 --- '
        "&cred_type=1"
        "&sum=" & cstr(totalAmountToCharge)
        "&pdesc=" & "order " & IDorder & " at "+baseURL
        "&company=ticket4me"
        */

        option = {
            ccIDnumber: myCart.ccIDnumber,
            ccNumber: myCart.ccNumber,
            ccExpiration:myCart.ccExpiration,
            ccCVV:myCart.ccCVV,
            totalAmountToCharge:totalAmountToCharge,
            iskaCurrencyTranz:iskaCurrencyTranz,
            ChargeMode:'J5',//type token = or direct or J5 or ChargeJ5 or direct
            iskaMaxPayments:myCart.iskaMaxPayments,
            lang:pLang,
        }

        // חיוב ראשוני מסוג J5
        let chargeResponse = await GlobalFunction.getPay(IDbranch , option)
        console.log('chargeResponse = ' , chargeResponse);

        
        // יבדוק אם נתקבל אישור והחיוב J5 עבר בהצלחה
        if (chargeResponse.status != 'success') {
            // יציג הודעה "חיוב כרטיס האשראי שלך נכשל, אנא נסה שנית", ויחזיר אל pp7 (לא נוצרת הזמנה כלשהי)
            // == שלומי == לשים פה הפנייה חזרה אל דף 7 להזנה מחדש של כרטיס אשראי, לשמור כל פרטי ההזמנה שכבר הוזנו ==
            resolve({status:'err' , msg : 'err card'})
            return
        }

        chargeResponse = JSON.stringify(chargeResponse.data)
        
        // -- אם הגענו לפה החיוב עבר בהצלחה, כעת יוצר את ההזמנה במסד הנתונים (טבלת הזמנות) --

        //let IDorder                     = myCart.IDorder    // מוגדר בתחילת הפונקציה
        let IDIska                      = orderTicketsPaidArr[0][0]
        let IDsubOrder                  = 1
        let IDcustomer                  = myCart.IDcustomer
        let IDpayment                   = 0     // מספר מזהה רשומת התשלום, יוגדר בהמשך
        let IDsapak                     = 0
        //let orderType                   = *myCart.orderType*    // מוגדר בתחילחת הפונקציה
        let orderStatus                 = 40    // שולמה חלקית
        let IDinlay                     // במערך orderTicketsTotalArr[x][1] שונה לכל עסקה בהזמנה
        let manualOrder                 = null
        let orderFeatureOptionsTotal    // במערך orderFeatureOptionsArr[x][1] שונה לכל עסקה בהזמנה, במיקום זה במערך מאוחסן מערך נוסף מס' אפשרות ומס' הפעמים שמופיע לעסקה
        let orderFeatureOptionsPaid     // במערך orderFeatureOptionsArr[x][1] שונה לכל עסקה בהזמנה, במיקום זה במערך מאוחסן מערך נוסף מס' אפשרות ומס' הפעמים ששולם בהזמנה עבור העסקה
        let orderUpsales                // במערך orderUpsalesArr[x][1] שונה לכל עסקה בהזמנה 
        let orderCoupon                 = myCart.orderCoupon        // קוד קופון שהשתמשו בו, אם היה
        let orderCouponAmount           = couponDiscountAmount      // סכום הנחה שהקנה הקופון, אם היה כזה
        let timeToCompletePartsPayment  // מוגדר בהמשך אם הזמנה ראשית או משנית ואם התקבל עם פרטי ההזמנה
        let orderTicketsTotal           // במערך orderTicketsTotalArr[x][1] שונה לכל עסקה בהזמנה
        let orderTicketsPaid            // במערך orderTicketsPaidArr[x][1] שונה לכל עסקה בהזמנה
       
        let orderPartsTotal             = 0      // במוצר\מזון יש לעדכן פה מספר המשתתפים
        let orderPartsPaid              = 0      // במוצר\מזון יש לעדכן פה מספר החלקים ששולם
        
        let orderFriendsShareDiscount   = iskaFriendsShareDiscount              // גובה ההנחה באחוזים אם יש
        let orderFriendsShareDiscountAmount = parseFloat(iskaFriendsShareDiscountAmount)    // סכום ההנחה בפועל בשקלים או מטבע העסקה
        
        let orderShipmentFirstName      = myCart.deliveryDetails.orderShipmentFirstName      // יש לעדכן עבור מוצר\מזון + מכרז
        let orderShipmentLastName       = myCart.deliveryDetails.orderShipmentLastName      // יש לעדכן עבור מוצר\מזון + מכרז
        let orderShipmentPhoneNumber    = myCart.deliveryDetails.orderShipmentPhoneNumber      // יש לעדכן עבור מוצר\מזון + מכרז
        let orderShipmentCity           = myCart.deliveryDetails.orderShipmentCity      // יש לעדכן עבור מוצר\מזון + מכרז
        let orderShipmentStreet         = myCart.deliveryDetails.orderShipmentStreet      // יש לעדכן עבור מוצר\מזון + מכרז
        let orderShipmentHouseNumber    = myCart.deliveryDetails.orderShipmentHouseNumber      // יש לעדכן עבור מוצר\מזון + מכרז
        let orderShipmentAppartment     = myCart.deliveryDetails.orderShipmentAppartment      // יש לעדכן עבור מוצר\מזון + מכרז
        let orderShipmentRemarks        = myCart.deliveryDetails.orderShipmentRemarks      // יש לעדכן עבור מוצר\מזון + מכרז

        let IDparent                    = null      // מזהה לקוח אב של הלקוח המזמין, רק בהזמנה משנית יהיה כזה

        if (orderIsPrimary) {

            // זוהי הזמנה ראשונית, המזמין הוא מארגן ההזמנה, בודק שמספר ההזמנה הזמני שהוקצה עדיין פנוי לשימוש, ואם לא מחליף אותו במספר פנוי חדש
            rs = await GlobalFunction.getFields('orders','IDorder','WHERE IDorder='+IDorder)
            if (rs!='notFound') { 
                let tempIDorder = rs[0].IDorder
                IDorder = await GlobalFunction.getRandNumber(6,'orders','IDorder',false)
                // == להוסיף בהחלפה במסד זיהוי לפי routeCode שיתקבל עפ פרטי ההזמנה, כרגע ההחלפה לא טובה ותחליף גם את ההזמנה המקורית! ==
                Pool.query("UPDATE router SET routeURL=REPLACE(routeURL, '/pp10/"+tempIDorder+"','/pp10/"+IDorder+"')", async (err, rs ,fields) => {
                //console.log(err, rs)
                if (rs.changedRows>0) { console.log('changed routeURL records with new IDorder') }
                else { console.log('did not find any routeURL records to update with new IDorder') }
                })
                console.log('new IDorder='+IDorder, 'not availbale temp IDorder was '+tempIDorder)
            }

            timeToCompletePartsPayment = 60
            if (!isNaN(myCart.timeToCompletePartsPayment)) { timeToCompletePartsPayment = myCart.timeToCompletePartsPayment }
            timeToCompletePartsPayment = format(new Date(addMinutes(new Date(),timeToCompletePartsPayment )), "yyyy-MM-dd HH:mm:ss")
            // if (!isNaN(myCart.timeToCompletePartsPayment)) {
            //     timeToCompletePartsPayment = new Date();
            //     timeToCompletePartsPayment = new Date(timeToCompletePartsPayment.getTime() - timeToCompletePartsPayment.getTimezoneOffset() * 60000);
            //     timeToCompletePartsPayment.setMinutes (timeToCompletePartsPayment.getMinutes()+parseInt(myCart.timeToCompletePartsPayment))
            //     timeToCompletePartsPayment = timeToCompletePartsPayment.toISOString().slice(0, 19).replace('T', ' ')
            // }

        } else {

            // -- זוהי הזמנה משנית - משתתף בהזמנה הגיע לשלם את חלקו --
            rs = await GlobalFunction.getFields('orders','(IDsubOrder+1) as idson','WHERE IDorder='+IDorder+' ORDER BY IDsubOrder DESC LIMIT 1')
            if (rs!=='notFound') { IDsubOrder = rs[0].idson } else { IDsubOrder = 99 }

            rs = await GlobalFunction.getFields('orders','timeToCompletePartsPayment','WHERE IDorder='+IDorder+' AND IDsubOrder=1 LIMIT 1')
            if (rs!=='notFound') { timeToCompletePartsPayment = format(new Date(rs[0].timeToCompletePartsPayment), "yyyy-MM-dd HH:mm:ss") } else { timeToCompletePartsPayment = '2050-01-01 00:00:00' }

            rs = await GlobalFunction.getFields('orders','IDcustomer','WHERE IDorder='+IDorder+' AND IDsubOrder=1 LIMIT 1')
            if (rs!=='notFound') { IDparent = rs[0].IDcustomer } else { IDparent = null }

        }

        // שליפת מספר ספק
        rs = await GlobalFunction.getFields('iskaot','IDsapak','WHERE IDiska='+orderTicketsPaidArr[0][0])
        if (rs!='notFound') { IDsapak = rs[0].IDsapak }


        // -- יצירת רשומת הלקוח אם לא קיים --
        rs = await GlobalFunction.getFields('customers','IDcustomer',"WHERE customerPhoneNumber='"+myCart.Pickup.customerPhoneNumber+"'")
        if (rs!='notFound') { 
            console.log('look for IDcustomer by phone number, got -> '+rs[0].IDcustomer)
            // הלקוח קיים זיהוי לפי מספר טלפון
            IDcustomer = rs[0].IDcustomer 
            // מעדכן לו שם פרטי משפחה ואימייל לפי מה שהזין - למצב שהטלפון עבר כבר למישהו אחר, אז הפרטים שלו מתעדכנים אצלנו לפי מחזיק הטלפון החדש
            Pool.query("UPDATE customers SET customerFirstName='"+myCart.Pickup.customerFirstName+"', customerLastName='"+myCart.Pickup.customerLastName+"', customerEmail='"+myCart.Pickup.customerEmail+"' WHERE IDcustomer='" +IDcustomer+"' AND customerPhoneNumber='"+myCart.Pickup.customerPhoneNumber+"'", async (err, rs ,fields) => { })
        } else {
            if (IDcustomer.toString()=='0' || IDcustomer==0) { IDcustomer = await GlobalFunction.getRandNumber(6,'customers','IDcustomer',false) }
            rs = await GlobalFunction.getFields('customers','IDcustomer','WHERE IDcustomer='+IDcustomer)
            if (rs!='notFound') {
                // מספר לקוח זמני שהוקצה כבר תפוס, מקצה מספר חדש ומעדכן אם צריך קישורים בטבלת ראוטר
                let tempIDcustomer = rs[0].IDcustomer
                IDcustomer = await GlobalFunction.getRandNumber(6,'customers','IDcustomer',false)
                // == ***FIX-ME*** להוסיף בהחלפה במסד זיהוי לפי routeCode שיתקבל עפ פרטי ההזמנה, כרגע ההחלפה לא טובה ותחליף גם את ההזמנה המקורית! ==
                Pool.query("UPDATE router SET routeURL=REPLACE(routeURL, '/invite/"+tempIDcustomer+"','/invite/"+IDcustomer+"')", async (err, rs ,fields) => {
                if (rs.changedRows>0) { console.log('changed routeURL records with new IDcustomer ('+IDcustomer+')') }
                else { console.log('did not find any routeURL records to update with new IDcustomer ('+IDcustomer+')') }
                })
                console.log('new IDcustomer='+IDcustomer, 'not availbale temp IDcustomer was '+tempIDcustomer)
            }
            // יוצר רשומת לקוח חדש
            await Pool.query("INSERT INTO customers (IDcustomer, customerFirstName, customerLastName, customerPhoneNumber, customerEmail, IDparent, creationDate) VALUES ('"+IDcustomer+"','"+myCart.Pickup.customerFirstName+"','"+myCart.Pickup.customerLastName+"','"+myCart.Pickup.customerPhoneNumber+"','"+myCart.Pickup.customerEmail+"','"+IDparent+"',NOW())", async (err, rs ,fields) => {
                //console.log(rs, err)
                if (rs.affectedRows>0) { console.log('created new customer with IDcustomer '+IDcustomer) }
                else { console.log('*FAILED* to create new customer with IDcustomer '+IDcustomer) }
                })
        }
        console.log('final IDcustomer=', IDcustomer, myCart.Pickup.customerFirstName, myCart.Pickup.customerLastName, myCart.Pickup.customerPhoneNumber, myCart.Pickup.customerEmail, IDparent)
        //console.log('final IDcustomer='+IDcustomer)
        //console.log('ccNumber='+ccNumber)

        //iskaFriendsReturnDiscount בדיקה אם קיימת בעסקה מתן ההטבה על שיתוף 
        // אם כן יצירת קופון עם הנחה ושליחתו למשתף
        let rs13 = await GlobalFunction.getFields('iskaot','iskaFriendsReturnDiscount ','WHERE IDiska='+orderTicketsPaidArr[0][0]+' LIMIT 1')
        console.log('rs13 => ' , rs13);
        if(rs13 != 'NotFound'){
            let iskaFriendsReturnDiscount = rs13[0].iskaFriendsReturnDiscount
            console.log('iskaFriendsReturnDiscount = ' ,iskaFriendsReturnDiscount, 'myCart.inviteIDcustomer' , myCart.inviteIDcustomer);
            if(iskaFriendsReturnDiscount > 0 && myCart.inviteIDcustomer){
 
                let inviteIDcustomer = myCart.inviteIDcustomer 
                let InviteCustomerPhoneNumber = await GlobalFunction.getFields('customers','customerPhoneNumber',"WHERE IDcustomer='"+inviteIDcustomer  +"'")
                console.log('InviteCustomerPhoneNumber => ' , InviteCustomerPhoneNumber);
                if (InviteCustomerPhoneNumber!='notFound') { 
                    InviteCustomerPhoneNumber = InviteCustomerPhoneNumber[0].customerPhoneNumber 
                    let iskaUrl = process.env.pBaseURL + '/products/' + orderTicketsPaidArr[0][0]
                    iskaUrl = await GlobalFunction.setRoute(iskaUrl)
                    iskaUrl = iskaUrl.url
                    
                    let couponCode = await GlobalFunction.getRandNumber('7','coupons','couponCode')
                    coupon = {
                        IDiska:orderTicketsPaidArr[0][0],
                        couponName:'קופון שיתוף חברים',
                        CouponDiscount:iskaFriendsReturnDiscount,
                        couponCode:couponCode,
                    }
    
                    let sql = "INSERT INTO coupons (IDsapak, IDiska, couponName, CouponDiscount, couponCode, couponCounter, couponMaxUsage) VALUES ('" +IDsapak +"','"+ coupon.IDiska +"','"+ coupon.couponName +"','"+ coupon.CouponDiscount +"','"+ coupon.couponCode +"','0','1')"
                   
                    Pool.query(sql, async (err, rs ,fields) => {
                        if(err){ console.log(err); }
                    })
                
                    msg = "קוד קופון [[couponCode]] למימוש [[iskaUrl]]"
                    rs =  await GlobalFunction.getFields('systemMessages','msgContent',"WHERE IDmsg=1038 AND msgLang='"+pLang+"'")
                    if (rs!='notFound') { msg = rs[0].msgContent }
                    msg = msg.replace('[[iskaUrl]]', iskaUrl)
                    msg = msg.replace('[[couponCode]]', couponCode)
    
                    console.log(InviteCustomerPhoneNumber , msg);
                    await GlobalFunction.sendSMS(InviteCustomerPhoneNumber , msg)
                
                }

            }
        }

        // יוצר רשומת תשלום
        await Pool.query("INSERT INTO payments (IDcustomer, IDorder, IDsubOrder, paymentDate, paymentAmount, paymentCurrency, paymentReference1, paymentReference2, ipAddress, ccNumber, ccExpiration, ccIDnumber, ccCVV, paymentStatus) VALUES ('"+IDcustomer+"','"+IDorder+"','"+IDsubOrder+"',NOW(),'"+totalAmountToCharge+"','"+iskaCurrency+"','"+chargeResponse+"','"+paymentReference2+"','"+ipAddress+"','"+cryptr.encrypt(ccNumber)+"','"+cryptr.encrypt(ccExpiration)+"','"+cryptr.encrypt(ccIDnumber)+"','"+cryptr.encrypt(ccCVV)+"','0')", async (err, rs ,fields) => {
            //console.log(rs, err)
            if (rs.affectedRows>0) { console.log('created new payment record with ID '+rs.insertId); return rs.insertId }
            else { console.log('*FAILED* to create new payment record'); return 0 }
        })
        do {
            rs = await GlobalFunction.getFields('payments','IDpayment','WHERE IDorder='+IDorder+' AND IDcustomer='+IDcustomer+' AND IDsubOrder='+IDsubOrder+' ORDER BY IDpayment DESC LIMIT 1')
            if (rs!='notFound') { IDpayment = rs[0].IDpayment }
        } while (IDpayment==0);
        
        // --- טיפול בשדה הצעת מחיר שנתן המשתתף במכרז ---
        let auctionExtraField = ''
        let auctionExtraFieldValue = ''
        if (iskaType=='auction') {
            auctionExtraField = ", orderBidPrice"
            auctionExtraFieldValue = ",'"+orderBidPrice+"'"
        }
        

        // --- יוצר רשומה או רשומות הזמנה - אם יש יותר מעסקה אחת בהזמנה, לכל עסקה רשומת הזמנה נפרדת ---
        // loop thorugh all IDiska & tickets/products in this order - ii
        for (ii=0; ii<orderTicketsTotalArr.length; ii++) {
            
            let orderSQL = "INSERT INTO orders (IDorder, IDIska, IDsubOrder, orderDate, IDcustomer, IDpayment, IDsapak, orderType, orderStatus, IDinlay, manualOrder, orderFeatureOptionsTotal, orderFeatureOptionsPaid, orderUpsales, orderCoupon, orderCouponAmount, timeToCompletePartsPayment, t4m_pre_expiration_notification, orderTicketsTotal, orderTicketsPaid, orderPartsTotal, orderPartsPaid, orderFriendsShareDiscount, orderFriendsShareDiscountAmount, orderShipment, orderShipmentFirstName, orderShipmentLastName, orderShipmentPhoneNumber, orderShipmentCity, orderShipmentStreet, orderShipmentHouseNumber, orderShipmentAppartment, orderShipmentRemarks, IDbranch"+auctionExtraField+") VALUES ('"+IDorder+"','[[IDiska]]','"+IDsubOrder+"',NOW(),'"+IDcustomer+"','"+IDpayment+"','"+IDsapak+"','"+orderType+"','"+orderStatus+"','[[IDinlay]]','"+manualOrder+"','[[orderFeatureOptionsTotal]]','[[orderFeatureOptionsPaid]]','[[orderUpsales]]','[[orderCoupon]]','[[orderCouponAmount]]','"+timeToCompletePartsPayment+"',NOW(),'[[orderTicketsTotal]]','[[orderTicketsPaid]]','[[orderPartsTotal]]','[[orderPartsPaid]]','[[orderFriendsShareDiscount]]','[[orderFriendsShareDiscountAmount]]','[[orderShipment]]','"+orderShipmentFirstName+"','"+orderShipmentLastName+"','"+orderShipmentPhoneNumber+"','"+orderShipmentCity+"','"+orderShipmentStreet+"','"+orderShipmentHouseNumber+"','"+orderShipmentAppartment+"','"+orderShipmentRemarks+"','"+IDbranch+"'"+auctionExtraFieldValue+")"
            
            IDiska = orderTicketsTotalArr[ii][0]
            IDinlay = orderTicketsTotalArr[ii][1]
            console.log('getInlayMaxAvailableTickets('+IDinlay+') = ' + await GlobalFunction.getInlayMaxAvailableTickets(IDinlay))
            //totalFOcost = 0

            // ###################   פה לסדר את הנתונים לשמירה בשדות של ההזמנה, לחשוב מה לעשות עם עדכון מלאים של אפשרויות למוצר כאשר קונים מוצר בחלקים ##########
            // -- אפשרויות למוצר --
            foInventorySQL = ''
            orderFeatureOptionsTotal = '['
            orderFeatureOptionsPaid = '['

            let ticketsPaidNumber = 1
            if (iskaType!='attraction' && iskaType!='auction')     {
                ticketsPaidNumber = parseInt(orderTicketsPaidArr[ii][2])
                console.log('before sums update orderFeatureOptionsArr['+ii+'] = '+orderFeatureOptionsArr[ii])
                //console.log('orderTicketsTotalArr.length = '+orderTicketsTotalArr.length)
                console.log('orderFeatureOptionsArr['+ii+'].length = '+orderFeatureOptionsArr[ii].length)
                for (zz=0; zz<orderFeatureOptionsArr[ii][1].length; zz++) {
                    //singleFOcost = parseFloat(await GlobalFunction.getFeatureOptionCost(orderFeatureOptionsArr[ii][1][zz][0], IDiska))
                    // totalFOcost = totalFOcost + parseFloat(parseFloat(orderFeatureOptionsArr[ii][1][zz][1]) * singleFOcost)
                    // orderFeatureOptionsArr[ii][1][zz][2] = (orderFeatureOptionsArr[ii][1][zz][1] * singleFOcost).toFixed(2)
                    // console.log('totalFOcost: '+ totalFOcost)
                    if (orderFeatureOptionsTotal!='[') { orderFeatureOptionsTotal = orderFeatureOptionsTotal + ',' }
                    orderFeatureOptionsTotal  = orderFeatureOptionsTotal + '{"IDfo":"'+orderFeatureOptionsArr[ii][1][zz][0]+'","quantity":"'+orderFeatureOptionsArr[ii][1][zz][1]+'","cost":"'+(parseFloat(orderFeatureOptionsArr[ii][1][zz][2])).toFixed(2)+'"}'
                    foInventorySQL = foInventorySQL + 'UPDATE featureOptionsPerIska SET foInventory=foInventory-'+orderFeatureOptionsArr[ii][1][zz][1]+' WHERE IDfo='+orderFeatureOptionsArr[ii][1][zz][0]+' AND IDiska='+IDiska+'; ' 
                    
                    if (orderFeatureOptionsPaid!='[') { orderFeatureOptionsPaid = orderFeatureOptionsPaid + ',' }
                    orderFeatureOptionsPaid  = orderFeatureOptionsPaid + '{"IDfo":"'+orderFeatureOptionsPaidArr[ii][1][zz][0]+'","quantity":"'+orderFeatureOptionsPaidArr[ii][1][zz][1]+'","cost":"'+(parseFloat(orderFeatureOptionsPaidArr[ii][1][zz][2])).toFixed(2)+'"}'
                }
            }
            orderFeatureOptionsTotal = orderFeatureOptionsTotal + ']'
            if (!orderIsPrimary) { orderFeatureOptionsTotal = '' }     // איפוס שדה אפשרויות למוצר הכללי עבור רשומת הזמנה שאיננה ראשית, יופיע רק ברשומת הזמנה ראשית של כל עסקה בהזמנה-בסל הקניות
            orderFeatureOptionsPaid = orderFeatureOptionsPaid + ']'
            
            if (!orderIsPrimary) { 
                // -- משיכה מרשומת הזמנה ראשית של נתוני אפשרויות למוצר, מאחר ובהזמנה משנית הם לא מתקבלים --
                orderFeatureOptionsPaid = []
                
                if (iskaType!='attraction' && iskaType!='auction')     {
                
                    SQLquery = "WHERE IDorder='"+IDorder+"' AND IDsubOrder='1' AND IDiska='"+IDiska+"'"
                    if (iskaType=='professionals' || iskaType=='attraction') { SQLquery += " AND IDinlay='"+IDinlay+"'" }
                    SQLquery += " LIMIT 1"
                    rs3 =  await GlobalFunction.getFields('orders','orderFeatureOptionsTotal',SQLquery)
                    if (rs3!='notFound') {
                        //totalFOcost = 0
                        if(GlobalFunction.IsJsonString(rs3[0].orderFeatureOptionsTotal) && rs3[0].orderFeatureOptionsTotal.length>5) {
                            oua = JSON.parse(rs3[0].orderFeatureOptionsTotal)
                            for (jj=0; jj<oua.length; jj++) { 
                                if (iskaType=='professionals' || iskaType=='attraction') {
                                    // --- אטרקציה או בעלי מקצוע ---
                                    orderFeatureOptionsPaid.push({"IDfo":oua[jj].IDfo , "quantity":ticketsPaidNumber , "cost":parseFloat(parseFloat(oua[jj].cost)/parseInt(oua[jj].quantity)*ticketsPaidNumber).toFixed(2)})
                                    //totalFOcost = totalFOcost + parseFloat(oua[jj].cost)
                                } else {
                                    // --- אחרת זה מוצר\מזון או מכרז ---
                                    // NumberOfParticipants = מספר המשתתפים בהזמנה מוגדר כבר מעלה
                                    // IPayCount = מספר החלקים שהמזמין משלם מתוך כלל המשתתפים בהזמנה - מוגדר מעלה
                                    // orderFeatureOptionsPaid.push({"IDfo":oua[jj].IDfo , "quantity":(IPayCount+'/'+NumberOfParticipants).toString , "cost":parseFloat(parseFloat(oua[jj].cost)/parseInt(NumberOfParticipants)*parseInt(IPayCount)).toFixed(2)})
                                    ofoPaidQuantity = await setFractionNumber(parseInt(oua[jj].quantity)*IPayCount, NumberOfParticipants)
                                    orderFeatureOptionsPaid.push({"IDfo":oua[jj].IDfo , "quantity":ofoPaidQuantity , "cost":parseFloat(parseFloat(oua[jj].cost)/parseInt(NumberOfParticipants)*parseInt(IPayCount)).toFixed(2)})
                                    //totalFOcost = totalFOcost + parseFloat(parseFloat(oua[jj].cost)/parseInt(NumberOfParticipants)*parseInt(IPayCount))
                                }
                            }
                            //for (jj=0; jj<oua.length; jj++) { orderFeatureOptionsPaid.push({"IDfo":oua[jj].IDfo , "quantity":ticketsPaidNumber , "cost":parseFloat(parseFloat(rs3[0].cost)/parseInt(rs3[0].quantity)*ticketsPaidNumber).toFixed(2)}) }
                        }
                    }
                }
                orderFeatureOptionsPaid = JSON.stringify(orderFeatureOptionsPaid)
                //console.log('orderFeatureOptionsPaid = '+orderFeatureOptionsPaid, '(this will go into DB as is!)')
            }
            
            console.log('orderFeatureOptionsTotal = '+orderFeatureOptionsTotal, '(this will go into DB as is!)')
            console.log('orderFeatureOptionsPaid = '+orderFeatureOptionsPaid, '(this will go into DB as is!)')
            //console.log('after sums update orderFeatureOptionsArr['+ii+'] = '+orderFeatureOptionsArr[ii])
            
            orderTicketsTotal   = ''
            if (orderIsPrimary) { 
                if (iskaType=='attraction') {
                    console.log('טנמלאה: '+orderTicketsTotalArr[ii] +'\n\n')
                    // --- אטרקציה ---
                    orderTicketsTotal = JSON.stringify(orderTicketsTotalArr[ii][2])
                } else if (iskaType=='auction') {
                    // --- מכרז - כאן יכנס לשני השדות כמות:1, מחיר:עלות ההשתתפות במכרז ---
                    orderTicketsTotal = '[{"quantity":"'+orderTicketsTotalArr[ii][2]+'","cost":"'+parseFloat(parseFloat(orderTicketsTotalArr[ii][3])).toFixed(2)+'"}]' 
                } else {
                    // --- בעל מקצוע + מוצר\מזון ---
                    orderTicketsTotal = '[{"quantity":"'+orderTicketsTotalArr[ii][2]+'","cost":"'+parseFloat(parseFloat(orderTicketsTotalArr[ii][3])).toFixed(2)+'"}]' 
                }
            }
            if (iskaType=='attraction') {
                // console.log('טנמלאה: '+orderTicketsTotalArr[ii] +'\n\n')
                // --- אטרקציה ---
                console.log(orderTicketsPaidArr)
                orderTicketsPaid  = JSON.stringify(orderTicketsPaidArr[ii][2])
            } else if (iskaType=='auction') {
                // --- מכרז - כאן יכנס לשני השדות כמות:1, מחיר:עלות ההשתתפות במכרז ---
                orderTicketsPaid  = '[{"quantity":"'+orderTicketsPaidArr[ii][2]+'","cost":"'+parseFloat(parseFloat(orderTicketsPaidArr[ii][3])).toFixed(2)+'"}]'
            } else {
                // --- בעל מקצוע + מוצר\מזון ---
                orderTicketsPaid  = '[{"quantity":"'+orderTicketsPaidArr[ii][2]+'","cost":"'+parseFloat(eval(orderTicketsPaidArr[ii][2]) / orderTicketsTotalArr[ii][2] * (parseFloat(orderTicketsTotalArr[ii][3]))).toFixed(2)+'"}]'
            }
            console.log('orderTicketsTotal for DB => '+orderTicketsTotal+'  \n')

            if (iskaType!='attraction' && iskaType!='auction') { console.log('orderTicketsPaid parts calculation => '+parseFloat(eval(orderTicketsPaidArr[ii][2]) / orderTicketsTotalArr[ii][2] * (parseFloat(orderTicketsTotalArr[ii][3]))).toFixed(2),'=', orderTicketsPaidArr[ii][2],'/', orderTicketsTotalArr[ii][2],'*(',orderTicketsTotalArr[ii][3] ,')  \n') }
            console.log('orderTicketsPaid for DB => '+orderTicketsPaid+'  \n')
            orderPartsTotal = 0    // -- במוצר\מזון יש להגדיר פה ערך --
            orderPartsPaid  = 0    // -- במוצר\מזון יש להגדיר פה ערך --
            if (!isNaN(NumberOfParticipants) && NumberOfParticipants!=undefined) { 
                orderPartsTotal = NumberOfParticipants 
                orderPartsPaid = IPayCount
                }
                 
            console.log ('NumberOfParticipants='+NumberOfParticipants)
                
            // console.log('orderUpsalesArr[ii][1]='+orderUpsalesArr[ii][1])
            // console.log('orderUpsalesArr[ii][1].length='+orderUpsalesArr[ii][1].length)
            // return

            // -- מוצרים נלווים --
            orderUpsales        = '['
            upsaleInventorySQL = ''
            if (orderUpsalesArr.length>=ii) {
                for (zz=0; zz<orderUpsalesArr[ii][1].length; zz++) { 
                    if (orderUpsales!='[') { orderUpsales = orderUpsales + ','}
                    orderUpsales = orderUpsales + orderUpsalesArr[ii][1][zz]
                    //upsaleInventorySQL = upsaleInventorySQL + 'UPDATE upsales SET upsaleInventory=upsaleInventory-'+orderUpsalesArr[ii][1][zz][0][1]+', soldUnits=soldUnits+'+orderUpsalesArr[ii][1][zz][0][1]+' WHERE IDfo='+orderUpsalesArr[ii][1][zz][0][0]+'; ' 
                    //upsaleInventorySQL = upsaleInventorySQL + 'UPDATE upsales SET upsaleInventory=upsaleInventory-'+tmpObj.quantity+', soldUnits=soldUnits+'+tmpObj.quantity+' WHERE IDfo='+tmpObj.IDupsale+'; ' 
                    // ***FIX-ME*** להבין איך אפשר עם JSON לפתוח את המערך הזה של אפסיילים ***FIX-ME***
                }
            }
            orderUpsales = orderUpsales + ']'
            tmpObj = JSON.parse(orderUpsales)
            for (zz=0; zz<tmpObj.length; zz++) { 
                upsaleInventorySQL = upsaleInventorySQL + 'UPDATE upSales SET upsaleInventory=upsaleInventory-'+tmpObj[zz].quantity+', soldUnits=soldUnits+'+tmpObj[zz].quantity+' WHERE IDupsale='+tmpObj[zz].IDupsale+'; ' 
            }

            console.log('orderUpsales='+orderUpsales)
            console.log('upsaleInventorySQL='+upsaleInventorySQL)
            
            // -- משלוחים --
            console.log('orderShipmentArr['+ii+'].oShipDetails='+orderShipmentArr[ii].oShipDetails)
            if (orderShipmentArr[ii].oShipDetails!='') {
                orderShipment = JSON.stringify(orderShipmentArr[ii].oShipDetails)
                if (orderShipment.indexOf('[')==-1) { orderShipment = '['+orderShipment+']' }
                // orderShipment = []
                // orderShipment.push(orderShipmentArr[ii][2])
                //orderShipment = JSON.stringify(orderShipment)
                // orderShipment = orderShipment.replace('[[','[')
                // orderShipment = orderShipment.replace(']]',']')
            } else {
                orderShipment = 'null'
            }
            // orderShipmentType = null
            // orderShipment = null
            // orderShipmentPrice = null
            // if (orderShipmentArr.length>=ii) {
            //     orderShipmentType = orderShipmentArr[ii][2]
            //     orderShipment = orderShipmentArr[ii][3]
            //     orderShipmentPrice = orderShipmentArr[ii][4]
            // }

            // --- עדכון פרמטרים לעסקה מסוג מכרז ---
            if (iskaType=='auction') {
                IDinlay             = '0'
                orderPartsTotal     = '1'
                orderPartsPaid      = '1'

            } else if (iskaType=='product-food') {
                IDinlay             = '0'
            }

            // שלוף ממערכים אלה את הנתונים לפיזור ברשומות ההזמנה
            // orderUpsalesArr
            // orderTicketsTotalArr
            // orderTicketsPaidArr
            // orderFeatureOptionsArr
            // orderShipmentArr
            
            /*
            כל אלה שדות שיש להסדיר לפני הזנה לכל רשומה נפרדת שתיווצר להזמנה הזו
            * [[IDinlay]]
            * [[IDiska]]
            * [[orderFeatureOptionsTotal]]
            * [[orderFeatureOptionsPaid]]
            * [[orderUpsales]]
            * [[orderCoupon]]
            * [[orderCouponAmount]]
            * [[orderTicketsTotal]]
            * [[orderTicketsPaid]]
            * [[orderPartsTotal]]
            * [[orderPartsPaid]]
            * [[orderFriendsShareDiscount]]   only for first record
            * [[orderFriendsShareDiscountAmount]]    only for first record
            */

            console.log('========  הנמזהה תמושרל םירטמרפ םוכיס  ======================')
            console.log('IDiska = ' + IDiska)
            console.log('orderTicketsTotal = ' + orderTicketsTotal)
            console.log('orderTicketsPaid = ' + orderTicketsPaid)
            console.log('orderFeatureOptionsTotal = ' + orderFeatureOptionsTotal)
            console.log('orderFeatureOptionsPaid = ' + orderFeatureOptionsPaid)
            console.log('orderPartsTotal = ' + orderPartsTotal)
            console.log('orderPartsPaid = ' + orderPartsPaid)
            console.log('orderUpsales = ' + orderUpsales)
            console.log('orderShipment = ' + JSON.stringify(orderShipment))
            console.log('=================================================================')

            orderSQL = orderSQL.replace('[[orderTicketsTotal]]',orderTicketsTotal)
            orderSQL = orderSQL.replace('[[orderTicketsPaid]]',orderTicketsPaid)
            orderSQL = orderSQL.replace('[[IDiska]]',IDiska)
            orderSQL = orderSQL.replace('[[IDinlay]]',IDinlay)
            orderSQL = orderSQL.replace('[[orderPartsTotal]]',orderPartsTotal)
            orderSQL = orderSQL.replace('[[orderPartsPaid]]',orderPartsPaid)
            orderSQL = orderSQL.replace('[[orderUpsales]]',orderUpsales)
            orderSQL = orderSQL.replace('[[orderFeatureOptionsTotal]]',orderFeatureOptionsTotal)
            orderSQL = orderSQL.replace('[[orderFeatureOptionsPaid]]',orderFeatureOptionsPaid)
            orderSQL = orderSQL.replace('[[orderShipment]]',orderShipment)
            
            // if (orderType=='רכישה קבוצתית' ) {
            //     // --- עדכון משלוח גם בהזמנות משנה רק של רכישה קבוצתית - כל מזמין בוחר את כתובת וסוג המשלוח שלו ---
            //     orderSQL = orderSQL.replace('[[orderShipment]]',JSON.stringify(orderShipment))
            // } else {
            //     // --- כל מצב אחר אין בהזמנה משנית נתוני משלוח ---
            //     orderSQL = orderSQL.replace('[[orderShipment]]','null')
            // }

            if (ii==0) {
                // -- החלפות שמתבצעות רק לרשומת הזמנה הראשונה, גם אם יש יותר מעסקה אחת בהזמנה --
                orderSQL = orderSQL.replace('[[orderFriendsShareDiscount]]',orderFriendsShareDiscount)
                orderSQL = orderSQL.replace('[[orderFriendsShareDiscountAmount]]',orderFriendsShareDiscountAmount)
                orderSQL = orderSQL.replace('[[orderCoupon]]',orderCoupon)
                orderSQL = orderSQL.replace('[[orderCouponAmount]]',orderCouponAmount)
            } else {
                orderSQL = orderSQL.replace('[[orderFriendsShareDiscount]]','0')
                orderSQL = orderSQL.replace('[[orderFriendsShareDiscountAmount]]','0')
                orderSQL = orderSQL.replace('[[orderCoupon]]','0')
                orderSQL = orderSQL.replace('[[orderCouponAmount]]','0')
            }
            

            //orderSQL = orderSQL.replaceAll("'null'",'null')
            orderSQL = orderSQL.replace(/'null'/g,'null')

            console.log(orderSQL);

            if (orderIsPrimary || (!orderIsPrimary && ticketsPaidNumber>0)) {
                // --- יצור רשומת הזמנה רק אם הזמנה ראשית או אם משנית אבל עם כרטיס אחד לפחות ששולם בעסקה --
                // --- insert here into orders ---
                console.log(orderSQL+'  \n')

                // ***FIX-ME***
                // return

                Pool.query(orderSQL, async (err, rs ,fields) => {
                    console.log(rs, err)
                    if (rs.affectedRows>0) { console.log('created new order record (for specific IDiska)') }
                    else { console.log('*FAILED* to create new order record') }
                })
            }

            // -- אם יש הושבה בעסקה מעדכן מספרי ההזמנה וסאב הזמנה לכסאות שנבחרו בטבלת chairs --
            if (iskaType=='attraction' && myCart.CartActualOrder[ii].chairsSelected) {
                let chairsSelected = myCart.CartActualOrder[ii].chairsSelected
                Pool.query("UPDATE chairs SET IDorder='"+IDorder+"', IDsubOrder='"+IDsubOrder+"' WHERE IDiska='"+IDiska+"' AND IDinlay='"+IDinlay+"' AND IDchair IN (" + chairsSelected + ")", async (err, rs ,fields) => {
                    //console.log(rs, err)
                    if (rs.affectedRows>0) { console.log('updated chairs status inventory') }
                    else { console.log('*FAILED* to update chairs status!') }
                })
            }

            // -- מעדכן מלאים אפשרויות מוצר --
            if (foInventorySQL!='') {
                console.log(foInventorySQL)
                fois = foInventorySQL.split(";")
                for (zz=0; zz<fois.length; zz++) {
                    if (fois[zz].length>10) {
                        Pool.query(fois[zz], async (err, rs ,fields) => {
                            //console.log(rs, err)
                            if (rs.affectedRows>0) { console.log('updated featureOptions inventory') }
                            else { console.log('*FAILED* to update featureOptions inventory') }
                        })
                    }
                }
                foInventorySQL = ''
            }
            
            // -- מעדכן מלאים מוצרים נילווים --
            if (upsaleInventorySQL!='') {
                console.log(upsaleInventorySQL)
                fois = upsaleInventorySQL.split(";")
                for (zz=0; zz<fois.length; zz++) {
                    if (fois[zz].length>10) {
                        await Pool.query(fois[zz], async (err, rs ,fields) => {
                            //console.log(rs, err)
                            if (rs.affectedRows>0) { console.log('updated upsales inventory') }
                            else { console.log('*FAILED* to update upsales inventory') }
                        })
                    }
                }
                upsaleInventorySQL = ''
            }
            
            // -- מעדכן כמות שימושים בקופון --
            if (couponCounterSQL!='') {
                console.log(couponCounterSQL)
                await Pool.query(couponCounterSQL, async (err, rs ,fields) => {
                    //console.log(rs, err)
                    if (rs.affectedRows>0) { console.log('updated coupon usage counter') }
                    else { console.log('*FAILED* to update coupon usage counter') }
                })
                couponCounterSQL = ''
            }

            // -- מסיים פה לולאה על כל העסקאות בהזמנה ii --
        }


        
        
        // -- מגדיר את הקישור האישי של הלקוח המשלם אל דף pp10 --
        // let pp10PersonalLink = process.env.pBaseURL+'/pp10/'+IDorder+'/'+IDcustomer
        // -- מגדיר את הקישור האישי של הלקוח המשלם אל דף סיכום הזמנה pp11 --
        let pp10PersonalLink = process.env.pBaseURL+'/pp11/'+IDorder+'/'+IDcustomer
        console.log('pp10PersonalLink original = '+pp10PersonalLink)
        let pp10PersonalLinkEncoded = await GlobalFunction.setRoute(pp10PersonalLink)
        pp10PersonalLinkEncoded = pp10PersonalLinkEncoded.url
        console.log('pp10PersonalLinkEncoded after setRoute = '+pp10PersonalLinkEncoded)
        
        // ---מבצע בדיקה אם כל הכרטיסים בהזמנה כבר שולמו J5 ואם כן מחייב את כולם על אמת וסוגר את ההזמנה לסטטוס 50
        if (iskaType!='auction'){
            let orderMovedToStatus50 = await CheckAndCompleteOrder(IDorder, pp10PersonalLinkEncoded, myCart.Pickup.customerPhoneNumber, pLang , orderIsPrimary)
            // --- orderMovedToStatus50 can be true or false ---
        }else{
            // שלח הודעה 1039 על השתתפות במרכז
            Pool.query('SELECT c.IDcustomer, c.customerPhoneNumber, o.IDorder FROM customers as c LEFT JOIN orders as o ON (c.IDcustomer=o.IDcustomer) WHERE IDorder='+IDorder, async (err, rs2 ,Fields) => {
                if (rs2.length>0) {
                    let customerPhoneNumberACC = '|'
                    let msgBase = '[[pp10PersonalLink]]'
                    IDmsg = 1039
                    console.log('IDmsg to send: '+IDmsg, 'iskaType recognized inside block is: '+iskaType)
                    rs3 =  await GlobalFunction.getFields('systemMessages','msgContent',"WHERE IDmsg='"+IDmsg+"' AND msgLang='"+pLang+"'")
                    if (rs3!='notFound') { msgBase = rs3[0].msgContent }
                    //msgBase = msgBase.replace('[[IDorder]]', rs2[0].IDorder)
                    rs2.forEach(async (element) => {
                        console.log(element.IDorder, element.IDcustomer, element.customerPhoneNumber)
                        pp10linkPerParticipant =  await GlobalFunction.setRoute(process.env.pBaseURL+'/pp11/'+element.IDorder+'/'+element.IDcustomer)
                        console.log('pp10linkPerParticipant='+pp10linkPerParticipant.url+'\n\n\n\n')
                        msg = msgBase.replace('[[pp10PersonalLink]]', pp10linkPerParticipant.url)
                        if (customerPhoneNumberACC.indexOf('|'+element.customerPhoneNumber+'|')==-1) {
                            await GlobalFunction.sendSMS(element.customerPhoneNumber , msg)
                            customerPhoneNumberACC += element.customerPhoneNumber+'|'
                        }
                    })
                }
            })
            
        }

        
        
        // --- מפנה את המזמין אל pp10 עם הקישור האישי שלו ---
        // ***FIX-ME*** להציב פה החלפה של הדומיין למקומי אם עובדים בסבית הפיתוח, כמו שזה מוגדר זה לא עובד
        //if(window.location.host.indexOf("localhost")!=-1){ pp10PersonalLink = pp10PersonalLink.replace(process.env.pBaseURL+'/','http://localhost:5100/') }   // -- משנה דומיין למקומי אם בסביבת הפיתוח --
        redirectTo = pp10PersonalLink
        
        console.log('return of this function: redirectTo -> '+redirectTo)
        
        // ################# DEBUG LINE - ***FIX-ME*** later ########################
        // return

        resolve({status : "success","redirectTo" : redirectTo})
    })
}





async function getOrderDetailsForPP10(IDorder, IDcustomer) {
    console.log(IDorder, IDcustomer);
    // --- שולפת נתונים ומצב הזמנה להצגה בהתאמה בדף pp10 ---
    // --- אם סטטוס הזמנה לא מתאים לדף 10 תוחזר תשובה מתאימה לאן להעביר את הגולש ---
    return new Promise(async (resolve, reject) => {
        Pool.query("SELECT ord.IDorder, ord.IDIska as ordIDiska, ord.IDsubOrder, ord.IDcustomer, ord.IDpayment, ord.orderType, ord.orderStatus, ord.manualOrder, ord.timeToCompletePartsPayment, ord.orderTicketsTotal, ord.orderTicketsPaid, ord.orderPartsTotal, ord.orderPartsPaid, ord.IDinlay, ord.orderCouponAmount, ord.orderFriendsShareDiscountAmount, ord.orderFeatureOptionsTotal, ord.IDbranch, ord.orderShipment, cus.customerFirstName, cus.customerLastName, isk.iskaName, isk.iskaCurrency, isk.iskaTakanon ,isk.iskaTakanonFileName,  isk.iskaAboutFileName  ,isk.iskaAboutFileNameLink  ,isk.iskaMaxPayments, isk.IDsapak, isk.iskaType, isk.iskaFriendsShareDiscount, inl.inlaySchedule FROM orders as ord LEFT JOIN iskaot as isk ON (ord.IDIska=isk.IDiska) LEFT JOIN customers as cus ON (ord.IDcustomer=cus.IDcustomer) LEFT JOIN inlays as inl ON (ord.IDinlay=inl.IDinlay) WHERE ord.IDorder=(?) ORDER BY ord.idx, ord.IDsubOrder",[IDorder], async (err, rs ,fields) => {
            // console.log(err, rs)
           if(err){
               console.log(err);
           }
           
            if(rs.length == 0){
                resolve({redirectTo:"home" , msg:"ההזמנה עדיין בתהליך הקמה, יש לנסות שנית בעוד כ 5-10 דקות", err:2300})  
                return
            }

            if(rs.length > 0){
                if(rs[0].iskaType == 'auction'){
                    resolve({redirectTo:"pp11" , err:2302})  
                    return
                }
            }


            let iskaTakanonFileName
            let iskaAboutFileName 
            let IDcustomerMain = false
            let isLegitIDCustomer = false

            let orderStatus = parseInt(rs[0].orderStatus)
            let manualOrder = rs[0].manualOrder 
            let iskaType = rs[0].iskaType 
            let timeToCompletePartsPayment = rs[0].timeToCompletePartsPayment
            
            if(rs[0].iskaTakanonFileName) { 
                iskaTakanonFileName = rs[0].IDsapak + '/' + rs[0].iskaTakanonFileName 
            }
            if(rs[0].iskaAboutFileName) { 
                iskaAboutFileName = rs[0].IDsapak + '/' + rs[0].iskaAboutFileName 
            }
            console.log(rs[0].IDcustomer == IDcustomer , rs[0].IDsubOrder == 1);
            if(rs[0].IDcustomer == IDcustomer && rs[0].IDsubOrder == 1){
                IDcustomerMain = true
            }

           let CartActualOrder = []
            rs.forEach(element => {
                if(element.IDcustomer == IDcustomer){
                    isLegitIDCustomer = true
                }
                if(iskaType == 'product-food'){
                    console.log(CartActualOrder.findIndex(x => x.IDiska == element.ordIDiska));
                    console.log(element);
                    if(CartActualOrder.findIndex(x => x.IDiska == element.ordIDiska) == -1){
                        CartActualOrder.push({
                            IDiska:element.ordIDiska,
                            iskaName:element.iskaName
                        })
                    }
                }
            });

            if (!isLegitIDCustomer && !!IDcustomer) {
                // --- הועבר מספר לקוח שאינו תואם לרשומות ההזמנה הקיימות ששולמו כבר ---
                resolve({redirectTo : "pp10/IDorder" , err:2306})  // -- להפנות ל pp10 שוב עם מספר הזמנה בלבד, ללא מספר לקוח --
                // ***FIX-ME*** אולי לשלוח פה חזרה את מספר ההזמנה גם שיהיה קל להפנות ישר לקישור הנכון בלי חישובים
                return
            }

            
            if (orderStatus==20 || orderStatus==30 || orderStatus==60) {
                // --- מבוטלת, נמחקה, פגה תוקף ---

                resolve({redirectTo : "pp11"})  // -- ההזמנה הושלמה ונסגרה להעביר לדף pp11 --
                return
            } else if (orderStatus!=40 && orderStatus!=10 && orderStatus!=50) {
                // --- איננה שולמה חלקית, וגם איננה חיוב נכשל וגם איננה הושלמה ---
                resolve({redirectTo : "home" , err:2304})  // -- סטטוס הזמנה לא תקין \ לא ברור - להעביר לדף ראשי ללא הסבר --
                return
            }

                        
            if (manualOrder!=null) {
                // --- הזמנה ידנית שהוזנה ביומן בממשק הניהול ---
                resolve({redirectTo : "home"  , err:2301})  // -- להעביר לדף ראשי ללא הסבר --
                return
            }
            if (iskaType=='auction') {
                // --- עסקה מסוג מכרז, לא רלוונטית לדף זה ---
                resolve({redirectTo : "home" , err:2302})  // -- להעביר לדף ראשי ללא הסבר --
                return
            }

            //console.log('seconds difference: '+timeToCompleteOrderInSeconds,currentDate)

            // --- בדיקה אם חלף הזמן שניתן להשלים את התשלום על ההזמנה כולה, רק אם טרם נסגרה והושלמה יזרוק מפה ---
            // ***FIX-ME*** לאפשר שורות אלה בהמשך, אמור להיות פעיל ***FIX-ME***
            if (timeToCompletePartsPayment < Date.now() && orderStatus!=50) {
                resolve({redirectTo : "home - order has timed out" , err:2307}) // -- להעביר לדף ראשי עם הודעה שהזמן להשלמת ההזמנה חלף --
                return
            }
   
            let ticketsStatusResult
            let generalInfo = {
                "IDorder":  rs[0].IDorder ,
                "orderStatus": orderStatus,  // -- (מספיק לבדוק סטטוס של רשומת הזמנה ראשונה לקבלת תמונה על מצב ההזמנה כולה) --
                "IDiska": rs[0].ordIDiska ,
                "iskaCurrency": rs[0].iskaCurrency ,
                "inlaySchedule": rs[0].inlaySchedule,
                "timeToCompletePartsPayment": rs[0].timeToCompletePartsPayment ,
                "iskaTakanon": rs[0].iskaTakanon,
                "iskaTakanonFileName": iskaTakanonFileName,
                "iskaAboutFileName": rs[0].iskaAboutFileName,
                "iskaAboutFileNameLink": rs[0].iskaAboutFileNameLink,
                "iskaMaxPayments": rs[0].iskaMaxPayments,
                "isLegitIDCustomer": isLegitIDCustomer,
                "orderType": rs[0].orderType ,
                "iskaType": rs[0].iskaType ,
                "IDcustomerMain": IDcustomerMain,
                CartActualOrder:CartActualOrder
                
            }


 
            if(iskaType == 'professionals'){
                ticketsStatusResult = await loadPP10ForProfessionals(IDorder,rs)
             }
             
             if(iskaType == 'product-food'){
                ticketsStatusResult = await loadPP10ForProductFood(IDorder,IDcustomer,rs)
            }
     
            if(iskaType == 'attraction'){
                ticketsStatusResult = await loadPP10ForAttraction(IDorder,IDcustomer,rs)
                // console.log('ticketsStatusResult attraction ', ticketsStatusResult);
            }
            
            // console.log('ticketsStatusResult --->' , ticketsStatusResult);
            resolve({ "generalInfo":generalInfo, "ticketsStatusResult":ticketsStatusResult })
            return

        })
        
        /* --- דוגמא למערכים שחוזרים מהפונקציה ---
        
        generalInfo: [
        {
            IDorder: '2854499',
            IDiska: '4813695',
            iskaCurrency: 'ils',
            timeToCompletePartsPayment: '26044'   <---- זהו מספר השניות שיש להציג בטיימר בראש המסך, יש מצב עם בעיית הפרש שעתיים לשעון ישראל
        }

        ticketsStatusResult:
        [
            {IDiska:3333 , iskaName:"רצף בעל מקצוע" , ticket:"1/3" , payed:"true"  , payerName:"אורן משיח" , cost:"140.50" },
            {IDiska:3333 , iskaName:"רצף בעל מקצוע" , ticket:"2/3" , payed:"true"  , payerName:"אורן משיח" , cost:"140.50" },
            {IDiska:3333 , iskaName:"רצף בעל מקצוע" , ticket:"3/3" , payed:"false" , payerName:""           , cost:"140.50" },
            {IDiska:8282 , iskaName:"טייח מקצוען"   , ticket:"1/5" , payed:"true"  , payerName:"אורן משיח" , cost:"56.00"  },
            {IDiska:8282 , iskaName:"טייח מקצוען"   , ticket:"2/5" , payed:"true"  , payerName:"יוסי משה"  , cost:"56.00"  },
            {IDiska:8282 , iskaName:"טייח מקצוען"   , ticket:"3/5" , payed:"false" , payerName:""           , cost:"56.00"  },
            {IDiska:8282 , iskaName:"טייח מקצוען"   , ticket:"4/5" , payed:"false" , payerName:""           , cost:"56.00"  },
            {IDiska:8282 , iskaName:"טייח מקצוען"   , ticket:"5/5" , payed:"false" , payerName:""           , cost:"56.00"  }
        ]
        */
    })
}

async function loadPP10ForProfessionals(IDorder,rs){
    return new Promise(async (resolve, reject) => {

        let OrderGroup = _.groupBy(rs, function(ele){
            return ele.ordIDiska
        });
        
        let totalQuantity = 0
        let totalCost = 0
        let ticketsStatusResult = []

        await Object.keys(OrderGroup).forEachAsync(async(key,z) => {

            let minimumTicketsPerOrder = await GlobalFunction.getMinimumForOrder(OrderGroup[key][0].IDinlay, IDorder)
            OrderGroup[key].forEachAsync(async(element , ii) => {
                
                let FeatureOptionsCost = 0
                if(GlobalFunction.IsJsonString(element.orderFeatureOptionsTotal)) {
                    let orderFeatureOptionsTotal = JSON.parse(element.orderFeatureOptionsTotal)
                    console.log(orderFeatureOptionsTotal);
                    orderFeatureOptionsTotal.forEach(element => {
                        FeatureOptionsCost +=  parseFloat(element.cost) / parseFloat(element.quantity)
                    });
                    FeatureOptionsCost.toFixed(2)
                }


                if(GlobalFunction.IsJsonString(element.orderTicketsTotal)) {
                    let orderTicketsTotal = JSON.parse(element.orderTicketsTotal)

                    orderTicketsTotal.forEach(TicketsTotal => {
                        let cost = parseInt(TicketsTotal.cost)
                        let quantity = parseInt(TicketsTotal.quantity)
                        
                        totalQuantity +=  parseInt(TicketsTotal.quantity)
                        totalCost += parseInt(TicketsTotal.cost)
                        
                        for (let i = 1; i < quantity+1; i++) {

                            ticketsStatusResult.push({
                                IDiska: parseInt(key) , //תקין
                                iskaName: element.iskaName,//תקין
                                ticket: i + '/' + quantity ,//תקין
                                payed: false, //תקין נקבע למטה
                                payerName: '', //תקין נקבע למטה
                                price: ((cost + (FeatureOptionsCost * quantity)) / quantity).toFixed(2), //תקין 
                                IDinlay: element.IDinlay, //תקין
                                IDbranch: element.IDbranch, //תקין
                                featureOptionsIncluded: (FeatureOptionsCost > 0), //תקין
                                // iskaFriendsShareDiscount:0,
                                minimumTicketsPerOrder:minimumTicketsPerOrder //תקין
                            })
                        }
                    })
                }
                
            });
        });

        let payerName
        Object.keys(OrderGroup).forEach(async(key,zz) => {               
            OrderGroup[key].forEach(async(element , ii) => {
                payerName = element.customerFirstName + ' ' + element.customerLastName

                let paid = 0
                if(GlobalFunction.IsJsonString(element.orderTicketsPaid)){
                    let orderTicketsPaid = JSON.parse(element.orderTicketsPaid)
                    orderTicketsPaid.forEach(TicketsPaid => {
                        paid += parseInt(TicketsPaid.quantity)
                    });
                }
                
                for (let ttt = 1; ttt < paid + 1 ; ttt++) {
                    let IdxIDiska = ticketsStatusResult.findIndex(x => x.IDiska == key && !x.payed);
                    console.log(IdxIDiska);
                    if(IdxIDiska != -1){
                        ticketsStatusResult[IdxIDiska].payed = true
                        ticketsStatusResult[IdxIDiska].payerName = payerName
                    }
                }
            })
        })
        resolve(ticketsStatusResult)
    })
}


async function loadPP10ForAttraction(IDorder,IDcustomer,rs){
    return new Promise(async (resolve, reject) => {
        
        let OrderGroup = _.groupBy(rs, function(ele){
            return ele.ordIDiska
        });
        
        let totalQuantity = 0
        let totalCost = 0
        let ticketsStatusResult = []

        // console.log("OrderGroup123321",OrderGroup);

        await Object.keys(OrderGroup).forEachAsync(async(key,xxx) => {

            let minimumTicketsPerOrder = await GlobalFunction.getMinimumForOrder(OrderGroup[key][0].IDinlay, IDorder)
            let chairNameArr = await GlobalFunction.getChairsSelectedByIdiskaAndIDinlay(IDorder,parseInt(key),OrderGroup[key][0].IDinlay)
            console.log('chairNameArr' , chairNameArr);
            
            await OrderGroup[key].forEachAsync(async(element) => {
                let ii = 0

                if(GlobalFunction.IsJsonString(element.orderTicketsTotal)) {
                    let orderTicketsTotal = JSON.parse(element.orderTicketsTotal)
                    // console.log('orderTicketsTotal123321',orderTicketsTotal);
                    orderTicketsTotal.forEach((TicketsTotal) => {
                        let cost = parseInt(TicketsTotal.cost)
                        let quantity = parseInt(TicketsTotal.quantity)
                        let ttName = TicketsTotal.ttName
                        
                        totalQuantity +=  parseInt(TicketsTotal.quantity)
                        totalCost += parseInt(TicketsTotal.cost)
                        
                        // let TicketsBasic = {}
                        // TicketsBasic.ticketType = TicketsTotal.ticketType
                        // TicketsBasic.cost = cost/quantity
                        // TicketsBasic.ttName = ttName
                        // TicketsBasic.quantity = 1
                        let chairName = ""
                        
                        for (let i = 1; i < quantity+1; i++) {
                            
                            if(chairNameArr && chairNameArr.data[ii] && chairNameArr.data[ii].chairName ){
                                chairName = chairNameArr.data[ii].chairName
                            }
                            
                            ticketsStatusResult.push({
                                IDiska: parseInt(key) , //תקין
                                iskaName: element.iskaName + ' - ' + ttName,//תקין
                                ticket: i ,//תקין
                                payed: false, //תקין נקבע למטה
                                payerName: '', //תקין נקבע למטה
                                price: (cost/quantity).toFixed(2), //תקין 
                                IDinlay: element.IDinlay, //תקין
                                IDbranch: element.IDbranch, //תקין
                                // iskaFriendsShareDiscount:0,
                                minimumTicketsPerOrder:minimumTicketsPerOrder, //תקין
                                ttName:ttName,
                                IDticketType: TicketsTotal.ticketType,
                                inlaySchedule: element.inlaySchedule,
                                chairName: chairName
                                
                            })
                            ii++  
                        }
                    })
                }
              
            });
        });

        let payerName
        Object.keys(OrderGroup).forEach(async(key,zz) => {               
            OrderGroup[key].forEach(async(element , ii) => {
                payerName = element.customerFirstName + ' ' + element.customerLastName

                let paid = 0;
                let orderTicketsPaid =[];
                if(GlobalFunction.IsJsonString(element.orderTicketsPaid)){
                    orderTicketsPaid = JSON.parse(element.orderTicketsPaid)
                    // console.log('orderTicketsPaid123321',orderTicketsPaid);
                    orderTicketsPaid.forEach(TicketsPaid => {
                        paid += parseInt(TicketsPaid.quantity)
                    });
                }

                for(let el of ticketsStatusResult){
                    if(el.payed) continue;
                    const resultIndex  = orderTicketsPaid.findIndex(elPaid => elPaid.ticketType === el.IDticketType && elPaid.quantity>0 );
                    if(resultIndex>=0){
                        orderTicketsPaid[resultIndex].quantity-=1;
                        el.payed = true;
                        el.payerName = payerName;
                    }

                }
                
                // for (let ttt = 1; ttt < paid + 1 ; ttt++) {
                //     let IdxIDiska = ticketsStatusResult.findIndex(x => x.IDiska == key && !x.payed);
                //     console.log(IdxIDiska);
                //     if(IdxIDiska != -1){
                //         ticketsStatusResult[IdxIDiska].payed = true
                //         ticketsStatusResult[IdxIDiska].payerName = payerName
                //     }
                // }
                // console.log('ticketsStatusResult456654',ticketsStatusResult);
            })
        })
        // console.log('ticketsStatusResultResolve',ticketsStatusResult);

        resolve(ticketsStatusResult)
    })
}

async function loadPP10ForProductFood(IDorder,IDcustomer,rs){
    return new Promise(async (resolve, reject) => {
        
        // let totalQuantity = 0
        let totalCost = 0
        let ticketsStatusResult = []


        allsubOrder = _.groupBy(rs, function(ele){ 
            return ele.IDsubOrder 
        });


        await Object.keys(allsubOrder).forEachAsync(async(key) => {
      
            let customerName
            //if(IDcustomer == allsubOrder[key][0].IDcustomer){
                customerName = allsubOrder[key][0].customerFirstName +' '+ allsubOrder[key][0].customerLastName
            // }else{
            //     customerName = 'שולם - אחר'
            // }


            for (let i = 0; i < allsubOrder[key][0].orderPartsPaid  ; i++) {
                ticketsStatusResult.push({
                    // IDiska: parseInt(i) , //תקין
                    iskaName: '',//תקין נקבע למטה
                    ticket: i + '/' + 1 ,//תקין
                    payed: true, //תקין נקבע למטה
                    payerName: customerName, //תקין נקבע למטה
                    price: 0, //תקין 
                    iskaFriendsShareDiscount:allsubOrder[key][0].iskaFriendsShareDiscount,
                    minimumTicketsPerOrder:0 //תקין
                })
            }

        })

        // console.log('allsubOrder' , allsubOrder[1]);

        // סיכום של התשלום
        for (let zz = 0; zz < allsubOrder[1].length; zz++) {
            // מחיר כרטיסים 
            if(GlobalFunction.IsJsonString(allsubOrder[1][zz].orderTicketsTotal)){
                orderTicketsTotal = JSON.parse(allsubOrder[1][zz].orderTicketsTotal)
                if(orderTicketsTotal[0].cost)
                totalCost += parseFloat(orderTicketsTotal[0].cost) 
            }
            // מחיר תוספות  
            if(GlobalFunction.IsJsonString(allsubOrder[1][zz].orderFeatureOptionsTotal)){
                orderFeatureOptionsTotal = JSON.parse(allsubOrder[1][zz].orderFeatureOptionsTotal)
                orderFeatureOptionsTotal.forEach(FeatureOptions => {
                totalCost += parseFloat(FeatureOptions.cost)
                });
            }
            // מחיר משלוח
            if(GlobalFunction.IsJsonString(allsubOrder[1][zz].orderShipment) && allsubOrder[1][zz].orderShipment){
                orderShipment = JSON.parse(allsubOrder[1][zz].orderShipment)
                if(orderShipment[0].cost)
                totalCost += parseFloat(orderShipment[0].cost) 
            }
        }
        
        // הנחת קופון והנחת שיתוף
        // totalCost -= parseFloat(allsubOrder[1][0].orderFriendsShareDiscountAmount)
        // totalCost -= parseFloat(allsubOrder[1][0].orderCouponAmount)

        // allsubOrder[1][0].orderShipment
        // [{"type":"self-pickup", "id":"82", "cost":"0", "name":"איסוף עצמי מסניף רוממה", "details":"המלאכה 12 ראש העין, 03-6339922, ימים א-ה מ 7:00 עד 15:00"}]
        
        let paidTicktCount = ticketsStatusResult.length
        let orderPartsTotal = rs[0].orderPartsTotal
        
        
        console.log(totalCost , orderPartsTotal);
        
        for (let i = paidTicktCount; i < orderPartsTotal; i++) {
            ticketsStatusResult.push({ "name":'טרם שולם' , "payment":'תשלום ' + (i + 1),  "cost":'0.00' })   
        }


        ticketsStatusResult.forEach((Tickets , i) => {
            Tickets.price =  (totalCost / orderPartsTotal).toFixed(2)
            Tickets.iskaName = 'תשלום ' + (i + 1) 
        })


        resolve(ticketsStatusResult)

    })
}


async function getOrderDetailsForPP11(IDorder, IDcustomer) {
    // --- שולפת נתונים ומצב הזמנה להצגה בהתאמה בדף pp11 ---
    // --- אם סטטוס הזמנה לא מתאים לדף 11 תוחזר תשובה מתאימה לאן להעביר את הגולש ---

    // *************************************
    // לממשק לקוח
    // *************************************

    return new Promise(async (resolve, reject) => {
        
        
        let sql = ""
        let iskaType = await GlobalFunction.getFields('iskaot' , 'iskaType' , "left join orders on(orders.IDIska=iskaot.IDiska) WHERE orders.IDorder = '"+IDorder+"'")
        if (iskaType!='notFound') {
            iskaType = iskaType[0]
            if(iskaType == 'product-food'){
                sql = 'AND ord.IDcustomer=(?)'
            }
        } else {
            // -- לא מזהה סוג עסקה עפ מספר ההזמנה שסופקה , זורק לדף הבית --
            resolve({redirectTo : "home" , err:3310}) 
            return
        }

        Pool.query("SELECT ord.IDorder, ord.IDIska as ordIDiska, ord.IDsubOrder, ord.IDcustomer, ord.IDpayment, ord.orderType, ord.orderStatus, ord.manualOrder, ord.orderFeatureOptionsTotal, ord.timeToCompletePartsPayment, ord.orderTicketsTotal, ord.orderTicketsPaid, ord.orderPartsTotal, ord.orderPartsPaid, ord.IDinlay, ord.orderFeatureOptionsPaid, ord.orderUpsales, ord.orderShipment, ord.IDbranch, ord.orderCoupon, ord.orderCouponAmount, ord.orderBidPrice, ord.orderFriendsShareDiscountAmount, cus.customerFirstName, cus.customerLastName, isk.iskaName, isk.iskaCurrency, isk.iskaTakanon ,isk.iskaTakanonFileName , isk.iskaAboutFileName  ,isk.iskaAboutFileNameLink ,isk.iskaMaxPayments, isk.IDsapak, isk.iskaType, isk.iskaSmallLetters, inl.inlaySchedule, sp.branchAddress, pay.paymentAmount , sapakim.sapakLogo,sapakim.sapakName FROM orders as ord LEFT JOIN iskaot as isk ON (ord.IDIska=isk.IDiska) LEFT JOIN customers as cus ON (ord.IDcustomer=cus.IDcustomer) LEFT JOIN sapakBranches as sp ON (ord.IDbranch=sp.IDbranch) LEFT JOIN payments as pay ON (ord.IDpayment=pay.IDpayment) LEFT JOIN inlays as inl ON (ord.IDinlay=inl.IDinlay) LEFT JOIN sapakim ON (isk.IDsapak=sapakim.IDsapak) WHERE ord.IDorder=(?) "+sql+" ORDER BY ord.idx, ord.IDsubOrder",[IDorder, IDcustomer], async (err, rs ,fields) => {
            // console.log(err, rs)

            // console.log('rs' , rs)
            // return
            if (!IDcustomer) {
                // -- מספר לקוח לא סופק לפונקציה, אין דרך להציג סיכום הזמנה בלי זיהוי הלקוח, זורק אותו לדף הבית --
                resolve({redirectTo : "home" , err:3300}) 
                return
            }   

            if (rs.length==0) {
                // -- אין תוצאה לשאילתה, אין פרטי הזמנה להצגה, זורק לדף הבית --
                resolve({redirectTo : "home" , err:3301})
                return
            }
            
            if(rs[0].iskaType=='professionals'){
                let res = await ordersHelper.getProfessionalsOrder(IDorder, IDcustomer, rs)
                resolve(res)
                console.log(res);
            }

            if(rs[0].iskaType=='attraction'){
                let res = await ordersHelper.getAttractionOrder(IDorder, IDcustomer, rs)
                resolve(res)
                console.log(res);
            }
            
            if(rs[0].iskaType=='product-food'){
                let res = await ordersHelper.getProductFoodOrder(IDorder, IDcustomer, rs)
                resolve(res)
                // console.log(res);
            }

            if(rs[0].iskaType=='auction'){
                let res = await ordersHelper.getAuctionOrder(IDorder, IDcustomer, rs)
                resolve(res)
                console.log(res);
            }
            
            // -- כל מצב אחר שלא מטופל כאן, זורק לדף הבית --
            resolve({redirectTo : "home" , err:3302})
            return

        })
       
    })
}


async function DeleteTickets(IDorder,Tickets) {
    return new Promise(async (resolve, reject) => {
        deleteArr = []
        deleteChairs =[];
        console.log('DeleteTickets(IDorder,Tickets)',IDorder,Tickets)
        let data = _.groupBy(Tickets, function(Ticket){
            return Ticket.IPay && (Ticket.IDiska + (Ticket.IDticketType?(','+Ticket.IDticketType):''));
        });

        let allIDiska = []
        // console.log('data34537455', data)
        Object.keys(data).forEach(IDiska => {
            if(String(IDiska) !== 'false'){//no false! 
                const arr = IDiska.split(",");
                // console.log('arr2353765',arr)
                if(!allIDiska.includes(arr[0]))
                    allIDiska.push(arr[0])
                deleteArr.push({IDorder:IDorder , IDiska:arr[0] , countToDelete:data[IDiska].length, IDticketType: arr.length>1? arr[1]:undefined})
            }
        }); 
        allIDiska = allIDiska.join(", ") 
        // console.log('allIDiska2342345', allIDiska)
        // console.log('deleteArr2342345', deleteArr)
        
        Pool.query('SELECT IDiska, IDorder, orderTicketsTotal, orderFeatureOptionsTotal FROM orders WHERE IDorder = (?) AND IDiska IN ('+allIDiska+') AND IDsubOrder=1;',[IDorder], async(err, row) => {
            // row.forEach(element => {
            //     deleteArr[element.IDiska].orderTicketsTotal = element.orderTicketsTotal
            // });
            // console.log(row[0].IDiska);
            SQLtoUpdate = ''
            row.forEach(element => {
                let elem = _.where(deleteArr, {IDiska: element.IDiska.toString()})
                // console.log(elem[0].countToDelete,elem[0].IDiska,elem[0].IDorder , element.orderTicketsTotal);
                if(GlobalFunction.IsJsonString(element.orderTicketsTotal)){
                    // --- מעדכן בהתאם כמות כרטיסים ועלות כוללת שלהם ברשומת ההזמנה ---
                    element.orderTicketsTotal = JSON.parse(element.orderTicketsTotal)
                    // console.log('element.orderTicketsTotal67868 before',element.orderTicketsTotal);
                    for(let i=0; i<element.orderTicketsTotal.length; i++){
                        const currEl = element.orderTicketsTotal[i];
                        // console.log('deleteArr345345',deleteArr)
                        const ind = deleteArr.findIndex(el=> el.IDiska === element.IDiska.toString() && (currEl.ticketType?  String(el.IDticketType) === String(currEl.ticketType) : true) && el.countToDelete>0 );
                        if(ind>=0){
                            let tmpOrderTicketsTotalQuantity = parseInt(currEl.quantity)
                            let tmpOrderTicketsTotalCost = parseFloat(currEl.cost)
                            currEl.quantity = (tmpOrderTicketsTotalQuantity - deleteArr[ind].countToDelete).toString()
                            currEl.cost = (parseFloat(tmpOrderTicketsTotalCost/tmpOrderTicketsTotalQuantity) * parseInt(currEl.quantity)).toFixed(2).toString()
                            deleteChairs.push({IDiska: element.IDiska.toString(), count: deleteArr[ind].countToDelete })
                            deleteArr[ind].countToDelete=0;
                        }
                        
                    }
                    // console.log('element.orderTicketsTotal67868 after',element.orderTicketsTotal);
                    element.orderTicketsTotal = JSON.stringify(element.orderTicketsTotal)
                }
                if(GlobalFunction.IsJsonString(element.orderFeatureOptionsTotal)){
                    // --- מעדכן בהתאם כמות אפשרויות למוצר ועלות כוללת שלהם ברשומת ההזמנה ---
                    element.orderFeatureOptionsTotal = JSON.parse(element.orderFeatureOptionsTotal)

                    //console.log('orderFeatureOptionsTotal.length='+ element.orderFeatureOptionsTotal.length)
                    for (iix=0; iix<element.orderFeatureOptionsTotal.length; iix++) {
                    tmpOrderFeatureOptionsTotalQuantuty = parseInt(element.orderFeatureOptionsTotal[iix].quantity)
                    tmpOrderFeatureOptionsTotalCost = parseFloat(element.orderFeatureOptionsTotal[iix].cost)
                    element.orderFeatureOptionsTotal[iix].quantity = (tmpOrderFeatureOptionsTotalQuantuty - elem[0].countToDelete).toString()
                    element.orderFeatureOptionsTotal[iix].cost = (parseFloat(tmpOrderFeatureOptionsTotalCost/tmpOrderFeatureOptionsTotalQuantuty) * parseInt(element.orderFeatureOptionsTotal[iix].quantity)).toFixed(2).toString()
                    }
                    element.orderFeatureOptionsTotal = JSON.stringify(element.orderFeatureOptionsTotal)
                }

                // console.log(elem[0].countToDelete,elem[0].IDiska,elem[0].IDorder , element.orderTicketsTotal);
                // // console.log(_.where(goal, {category: "education"})); 
                SQLtoUpdate += "UPDATE orders SET orderTicketsTotal = '"+element.orderTicketsTotal+"', orderFeatureOptionsTotal = '"+element.orderFeatureOptionsTotal+"' WHERE IDorder = "+element.IDorder+" AND IDiska = "+element.IDiska+" AND IDsubOrder=1; \n\n "

            });
            console.log(SQLtoUpdate);
            // ***FIX-ME*** להוריד הערה מארבע השורות הבאות כדי שיבצע הפעולה מול מסד הנתונים
            
            // return;
            Pool.query(SQLtoUpdate,(err, rs ,fields) => {
               console.log(err,rs);
               // resolve({a:'a'})
            })
            
             // -- שולף מספר טלפון של מארגן ההזמנה, רק מארגן ההזמנה יכול להגיע להפעלת פונקציה זו של מחיקת כרטיסים מההזמנה ---
             let IDcustomerMain = 0
             let customerPhoneNumber
             rs =  await GlobalFunction.getFields('orders','IDcustomer',"WHERE IDorder='"+IDorder+"' AND IDsubOrder=1 LIMIT 1")
             if (rs!='notFound') { IDcustomerMain = rs[0].IDcustomer }
             rs =  await GlobalFunction.getFields('customers','customerPhoneNumber',"WHERE IDcustomer='"+IDcustomerMain+"'")
             if (rs!='notFound') { customerPhoneNumber = rs[0].customerPhoneNumber }

            // -- מגדיר את הקישור האישי של הלקוח המשלם אל דף pp10 --
            // let pp10PersonalLink = process.env.pBaseURL+'/pp10/'+IDorder+'/'+IDcustomer
            // -- מגדיר את הקישור האישי של הלקוח המשלם אל דף סיכום הזמנה pp11 --
            let pp10PersonalLink = process.env.pBaseURL+'/pp11/'+IDorder+'/'+IDcustomerMain
            console.log('pp10PersonalLink original = '+pp10PersonalLink)
            let pp10PersonalLinkEncoded = await GlobalFunction.setRoute(pp10PersonalLink)
            pp10PersonalLinkEncoded = pp10PersonalLinkEncoded.url
            console.log('pp10PersonalLinkEncoded after setRoute = '+pp10PersonalLinkEncoded)
            
            // ---מבצע בדיקה אם כל הכרטיסים בהזמנה כבר שולמו J5 ואם כן מחייב את כולם על אמת וסוגר את ההזמנה לסטטוס 50
            let orderMovedToStatus50 = await CheckAndCompleteOrder(IDorder, pp10PersonalLinkEncoded, customerPhoneNumber, 'he' , false)
            // --- orderMovedToStatus50 can be true or false ---
            
            console.log('orderMovedToStatus50='+orderMovedToStatus50.orderMovedToStatus50)
            let redirectTo = process.env.pBaseURL+'/pp10/'+IDorder+'/'+IDcustomerMain
            if (orderMovedToStatus50.orderMovedToStatus50) { redirectTo = pp10PersonalLink }

            console.log('deleteChairs7567567',deleteChairs)
            if(deleteChairs.length){
                deleteChairs.forEach(el => {
                    Pool.query('SELECT Idx FROM `chairs` where IDorder=(?) and IDiska=(?)',[IDorder, el.IDiska], async(err, row) => {
                        console.log(row)
                        let countDelete = row.length - el.count;
                        // console.log('countDelete64564532',countDelete)
                        for(let i =0; i<countDelete; i++){
                            row.shift();
                        }
                        console.log('row345363',row)
                        const strIdx = row.map(el=>el.Idx).join(', ');
                        const query = 'DELETE FROM chairs WHERE Idx IN ('+strIdx+')';
                        console.log('query45645634',query)
                        Pool.query(query);
                    })
                })
            }
            // return
            resolve({ status : 'success', redirectTo : redirectTo })
            
            // console.log(deleteArr);
            // console.log(deleteArr[element.IDiska]);
            // console.log(tmpOrderTicketsTotalQuantity, tmpOrderTicketsTotalCost, element.orderTicketsTotal[0].quantity, parseFloat(tmpOrderTicketsTotalCost/tmpOrderTicketsTotalQuantity)*parseInt(element.orderTicketsTotal[0].quantity) )

            // deleteArr[]
        })
    })
}

async function CheckAndCompleteOrderForAuction(IDorder, pp10PersonalLinkEncoded, customerPhoneNumber, pLang , orderIsPrimary){
    return new Promise(async (resolve, reject) => {
        console.log(IDorder, pp10PersonalLinkEncoded, customerPhoneNumber, pLang , orderIsPrimary);
        let auctionParticipants = 0
        let res = await GlobalFunction.getFields('orders' , 'count(idx) as auctionParticipants' , "WHERE IDiska='"+IDiska+"'")
        if(res != 'notFound'){
            auctionParticipants = res[0].auctionParticipants
        }
        console.log(auctionParticipants);
        resolve(true)
    })
}

// CheckAndCompleteOrder(583984, 'pp10PersonalLinkEncoded', '0508323234' , 'he' , false).then((x)=>{
//     console.log(x)
// })

async function GetStatusInvoiceGama(transactionProcessingEndpoint, token ){
     //get status
     return new Promise(async (resolve, reject) => {

     var axios = require('axios');

     var config = {
       method: 'get',
       url: 'https://'+process.env.gamaReceiptIP+'/gama-pay/1.0/payment/'+transactionProcessingEndpoint,
       headers: { 
         'token': token
       }
     };
     
     axios(config)
     .then(function (response) {
       console.log(JSON.stringify(response.data));
     })
     .catch(function (error) {
       console.log(error);
     });
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
          reject ({'error': true, errorData: response.data});
      }
    })
    .catch(function (error) {
      console.log(error);
      reject ({'error': true, errorData: error});
    });

    });

}


async function GetInvoiceGama(IDOrder, options){
    //auth
    console.log("GetInvoiceGama");
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
   

 
        const dataSend = [];
        // var result = await Pool.query('SELECT orders.orderTicketsPaid, orders.idiska, orders.IDsubOrder, orders.orderDate, orders.IDcustomer, customers.customerFirstName, customers.customerLastName, customers.customerPhoneNumber, customers.customerEmail, iskaot.iskaName, payments.ccNumber, payments.ccExpiration FROM `orders` left join customers on orders.IDcustomer=customers.IDcustomer join iskaot on orders.IDIska = iskaot.IDiska join payments on orders.IDpayment = payments.IDpayment where orders.IDorder='+IDOrder, async (err, rows ,fields));
        // console.log('await Pool.query result',result);

        Pool.query('SELECT orders.orderTicketsPaid, orders.idiska, orders.IDsubOrder, orders.orderDate, orders.IDcustomer, customers.customerFirstName, customers.customerLastName, customers.customerPhoneNumber, customers.customerEmail, iskaot.iskaName, payments.ccNumber, payments.ccExpiration FROM `orders` left join customers on orders.IDcustomer=customers.IDcustomer join iskaot on orders.IDIska = iskaot.IDiska join payments on orders.IDpayment = payments.IDpayment where orders.IDorder='+IDOrder, async (err, rows ,fields) => {
            // console.log(err);
            if (err){
                console.log(err);
                reject(err);
            }
            await rows.forEachAsync(row=>{
                
                    var items = [];

                    items.push({
                        "name": "עסקאות",
                        "quantity": 1,
                        // "price": rowDetails.cost*100,
                        "price": options.totalAmountToCharge,
                        "taxPercentage": 17,
                        "code": "98765"
                    });
                    var link = process.env.pBaseURL.replace("https://","");
                    var link = link.replace("http://","");
                    var link = link.replace(":","");
                    var ccNumber = cryptr.decrypt(row.ccNumber);
                    var ccExpiration = cryptr.decrypt(row.ccExpiration);
                    ccNumber = ccNumber.substring(ccNumber.length-4);
                    ccExpiration = ccExpiration.substring(0,3)+ccExpiration.substring(5,7);

                    var email = row.customerEmail === "" ? process.env.defaultEmail: row.customerEmail;
                    // var textitem = "ההזמנה "+ IDOrder + "באתר "+link;
                    var textitem = "הזמנה "+ IDOrder;
                    dataSend.push( {
                        "transactionProcessingId": transactionProcessingId,
                        "invoice": {
                            "invoiceType": "Invoice receipt",
                            "payerMail": email,
                            "subject": "תשלום בעסקאות",
                            "payerName": row.customerFirstName+" "+row.customerLastName,
                            "payerPhoneNumber": row.customerPhoneNumber,
                            "payerIdentifier": row.IDcustomer,
                            "currency": "ILS",
                            "roundAmount": options.totalAmountToCharge,
                            "items": [
                                {
                                    "name": textitem,
                                    "quantity": 1,
                                    "price": options.totalAmountToCharge,
                                    "taxPercentage": 17,
                                    "code": "00000"
                                }
                            ],
                            "payments": [
                                {
                                    "creditCardName": "אשראי",
                                    "numberOfPayments": "1", 
                                    "amount": options.totalAmountToCharge,
                                    "paymentMethod": "CreditCard",
                                    "paymentNumber": ccNumber,
                                    "expirationDate": ccExpiration
                                }
                            ]
                        }
                    });            
            })
    
    
            console.log("Data for sending invoices to server gama",dataSend);
    
            //transaction
            for(elData of dataSend){
                // await dataSend.forEachAsync(elData =>{
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
                    
                    var token = '';
                    var transactionProcessingEndpoint = '';
                    var transactionProcessingId = '';
                
                    // if(modeMockup){
                        // console.log('The autorize query was sent', config);
                    // }
                
                    
                    var response = await axios(config);
    
                    // .then(function (response) {
                      console.log("Response of authorization from gama server invoices",(response.data));
                      if(response.status == '200'){
                        token = response.data.token;
                        transactionProcessingEndpoint = response.data.transactionProcessingEndpoint;
                        transactionProcessingId = response.data.transactionProcessingId;
                      }else{
                          reject ({'error': true, errorData: response.data});
                      }

                    elData.transactionProcessingId = transactionProcessingId;  
    
                    // console.log('elData',elData);
                    var gamaTransactionId = '';
                    var config = {
                        method: 'post',
                        httpsAgent: httpsAgent,
                        url: 'https://'+transactionProcessingEndpoint+'/gama-pay/v1.0/payment/invoice',
                        headers: { 
                            'token': token, 
                            'Content-Type': 'application/json'
                        },
                        // data : JSON.stringify(dataTest)
                        data : JSON.stringify(elData)
                    };
            
                    // if(modeMockup){
                        // console.log('json config of axious that be going to send to server invoices gama', config);
                        // }
    
                        console.log("Attempt to get invoice from gama #1");
                        var response = await axios(config);
    
                        // .then(function (response) {  
                            console.log('response from server gama in 1 time - it is suceful response');
                            // console.log('response from server gama in 1 time - it is suceful response', response);
                            if(response.status == '200'){
                                gamaTransactionId = response.data.gamaTransactionId;
                            }else{
                                reject ({'error': true, errorData: response.data});
                            }
                   
                // });

            }
    
    
    
            
        });


        resolve({ error: false})

       
    // })
    // .catch(function (error) {
    //   console.log(error);
    //   if(!modeMockup)
    //   reject ({'error': true, errorData: error});
    // });

   


});

}


async function CheckAndCompleteOrder(IDorder, pp10PersonalLinkEncoded, customerPhoneNumber, pLang , orderIsPrimary) {
    return new Promise(async (resolve, reject) => {
        
        

        // --- בודק אם התשלום שבוצע הרגע סוגר ומשלים את ההזמנה סופית ---
        let totalAlreadyPaidForOrder    = 0
        let totalTicketsCost            = 0
        let totalFeatureOptionsCost     = 0
        let totalUpsalesCost            = 0
        let totalFriendShareDiscount    = 0
        let totalCouponDiscount         = 0
        let totalshipmentAmount          = 0
        let orderMovedToStatus50        = false
        let iskaType
        let respInvoice = {}; 

        // --- מחשב עלות כוללת של כל ההזמנה ---
        let SQLfields = 'orderFeatureOptionsTotal, orderUpsales, orderTicketsTotal, orderFriendsShareDiscountAmount, orderCouponAmount, orderShipment, IDiska'
        //if (iskaType=='product-food') { SQLfields = SQLfields.replace('orderTicketsTotal','orderPartsTotal')} // לא נכון, לא נדרש
        rs =  await GlobalFunction.getFields('orders',SQLfields,'WHERE IDorder='+IDorder)
        if (rs!='notFound') { 
            rs2 =  await GlobalFunction.getFields('iskaot','iskaType','WHERE IDiska='+rs[0].IDiska)
            iskaType = rs2[0].iskaType

            // if(iskaType == 'auction'){
            //     res = await CheckAndCompleteOrderForAuction(IDorder, pp10PersonalLinkEncoded, customerPhoneNumber, pLang , orderIsPrimary)
            //     console.log(res);
            //     return
            // }


            rs.forEach(element => {
                totalFriendShareDiscount = totalFriendShareDiscount + parseFloat(element.orderFriendsShareDiscountAmount)
                totalCouponDiscount = totalCouponDiscount + parseFloat(element.orderCouponAmount)
                if (GlobalFunction.IsJsonString(element.orderUpsales)) {
                    oua = JSON.parse(element.orderUpsales)
                    if (oua) {
                        for (ii=0; ii<oua.length; ii++) { totalUpsalesCost += parseFloat(oua[ii].cost) }
                    }
                }
                if (iskaType!='attraction') {
                    if (GlobalFunction.IsJsonString(element.orderFeatureOptionsTotal)) {
                        oua = JSON.parse(element.orderFeatureOptionsTotal)
                        if (oua) {
                            for (ii=0; ii<oua.length; ii++) { totalFeatureOptionsCost += parseFloat(oua[ii].cost) }
                        }
                    }
                }
                if (GlobalFunction.IsJsonString(element.orderTicketsTotal)) {
                    oua = JSON.parse(element.orderTicketsTotal)
                    if (oua) {
                        if (iskaType!='attraction') {
                            for (ii=0; ii<oua.length; ii++) { totalTicketsCost += parseFloat(oua[ii].cost) }
                        } else {
                            console.log(element.IDiska , oua)
                            oua.forEach(ott => { totalTicketsCost += parseFloat(ott.cost) })
                            // -- זה נראה אותו הדבר כמו החישוב בסוגי עסקאות אחרות, לבדוק בהמשך אפשרות לצמצם פה את התנאי המיותר --
                            // [{"ticketType":29,"ttName":"חייל/ת","quantity":1,"cost":"40.00"},{"ticketType":28,"ttName":"תלמיד","quantity":1,"cost":"30.00"}]
                        }
                    }
                }
                if (GlobalFunction.IsJsonString(element.orderShipment) && element.orderShipment) {
                    console.log('element.orderShipment' , element.orderShipment);
                    oua = JSON.parse(element.orderShipment)
                    console.log('oua=',oua)
                    if (oua) { totalshipmentAmount += parseFloat(oua[0].cost) }
                }
                if (iskaType=='auction') { totalshipmentAmount = 0 }
            });
        }
        // --- מחשב כמה סה"כ שולם עד כה בהזמנה ---
        console.log('totalAlreadyPaidForOrder = '+totalAlreadyPaidForOrder)
        rs =  await GlobalFunction.getFields('payments','sum(paymentAmount) as pas','WHERE IDorder='+IDorder+' AND (paymentStatus=0 OR paymentStatus=1)')
        if (rs!='notFound') { if (rs[0].pas!=null) {
            console.log(parseFloat(rs[0].pas)) 
            totalAlreadyPaidForOrder = parseFloat(rs[0].pas) 
        } }
        console.log('totalAlreadyPaidForOrder = '+totalAlreadyPaidForOrder)
        
        //rs =  await GlobalFunction.getFields('payments','paymentAmount','WHERE IDorder='+IDorder+' AND (paymentStatus=0 OR paymentStatus=1)')
        //if (rs!='notFound') { rs.forEach(element => { totalAlreadyPaidForOrder = totalAlreadyPaidForOrder + parseFloat(element.paymentAmount) }) }
        console.log('totalTicketsCost: '+totalTicketsCost+'\n'+'totalFeatureOptionsCost: '+totalFeatureOptionsCost+'\n'+'totalUpsalesCost: '+totalUpsalesCost+'\n'+'totalFriendShareDiscount: '+totalFriendShareDiscount+'\n'+'totalCouponDiscount: '+totalCouponDiscount+'\n'+'totalshipmentAmount: '+totalshipmentAmount+'\n')

        console.log('[paymets check] Order Total Cost: '+parseFloat(totalTicketsCost+totalFeatureOptionsCost+totalUpsalesCost+totalshipmentAmount-totalFriendShareDiscount-totalCouponDiscount).toFixed(2),'','Already Paid on this order: '+totalAlreadyPaidForOrder )

        let msg         // -- משמש לתוכן ההודעה שנשלחת ב SMS בהמשך --
        //let redirectTo  // -- הכתובת אליה יש לעבור לאחר השלמת התהליכים בפונקציה זו --

        if (parseFloat(totalAlreadyPaidForOrder) < parseFloat(totalTicketsCost+totalFeatureOptionsCost+totalUpsalesCost+totalshipmentAmount-totalFriendShareDiscount-totalCouponDiscount)) {
            
            // --- טרם שילמו את מלוא ההזמנה ---
            console.log('order not fully paid yet!')
            msg = '[[pp10PersonalLink]]'
            rs =  await GlobalFunction.getFields('systemMessages','msgContent',"WHERE IDmsg=1032 AND msgLang='"+pLang+"'")
            if (rs!='notFound') { msg = rs[0].msgContent }
            msg = msg.replace('[[IDorder]]', IDorder)
            msg = msg.replace('[[pp10PersonalLink]]', pp10PersonalLinkEncoded)
            await GlobalFunction.sendSMS(customerPhoneNumber , msg)
            
        } else {
            
            // --- ההזמנה שולמה J5 במלואה ---
            console.log('OK - can close this order!')
            
            // --- רץ על כל התשלומים של הזמנה זו ומבצע חיוב בפועל, כרגע כולם חיוב מותנה J5 ---
            let allPaymentsInStatus1 = true
            rs =  await GlobalFunction.getFields('payments','*','WHERE IDorder='+IDorder+' AND (paymentStatus=0 OR paymentStatus=1)')
            if (rs!='notFound') { 
                await rs.forEachAsync(async(element) => {
                    IDpayment           = element.IDpayment
                    paymentAmount       = parseFloat(element.paymentAmount) 
                    paymentReference1   = element.paymentReference1
                    ccNumber            = cryptr.decrypt(element.ccNumber)
                    ccExpiration        = cryptr.decrypt(element.ccExpiration)
                    ccIDnumber          = cryptr.decrypt(element.ccIDnumber)
                    ccCVV               = cryptr.decrypt(element.ccCVV)
                    paymentCurrency     = element.paymentCurrency
                    paymentReference1 = JSON.parse(paymentReference1)
                    // --- התאמת משתנה המטבע לחיוב במערכת טרנזילה ---
                    switch(paymentCurrency) {
                        case 'ils': paymentCurrency = '1'; break;
                        case 'usd': paymentCurrency = '2'; break;
                        case 'eur': paymentCurrency = '7'; break;
                        default:    paymentCurrency = '1';
                    }
                    // ***FIX-ME***  פה צריך להיות פוסט אל טרנזילה לחיוב של כל תשלום מהטבלה בנפרד ***FIX-ME***
                    // --- שים לב! החיוב לביצוע הוא יישום של חיוב J5 שבוצע ואושר קודם לכן, לא לחייב שוב את הכרטיס בחיוב נוסף!! ---
                    /*      ##############################################################
                    ##                                                          ##
                    ##    TRANZILA API HERE                                     ##
                    ##    POST ALL PARAMETERS TO CHARGE EXIST J5 TRANSACTION    ##
                    ##                                                          ##
                    ##############################################################    */
                    // --- לאחר החיוב חוזר פרמטר ccReply=000 אם החיוב עבר בהצלחה ---
                    // ccReply = '000'     // ***FIX-ME*** כרגע מוזן פה קשיח להסיר אחכ ***FIX-ME***
                    
                    
                    // עסקת אילוץ עם J5
                    // https://secure5.tranzila.com/cgi-bin/tranzila71u.cgi?supplier=captain&tranmode=F&index=179&sum=50&cy=1&cred_type=1&expdate=0424&TranzilaPW=BXXkTDK6
                    

                    option = {
                        ccIDnumber: ccIDnumber,
                        ccNumber: ccNumber,
                        ccExpiration:'',
                        ccCVV:ccCVV,
                        totalAmountToCharge:paymentAmount,
                        iskaCurrencyTranz:paymentCurrency,
                        ChargeMode:'ChargeJ5',//type token = or direct or J5 or ChargeJ5 or direct
                        lang:pLang,
                        index:paymentReference1.index,
                        ConfirmationCode:paymentReference1.ConfirmationCode
                    }


                    let IDbranch = await GlobalFunction.getFields('orders' , 'IDbranch' , "WHERE IDorder ='"+ IDorder +"'")
                    console.log(IDbranch);
                    if(IDbranch != 'notFound'){
                        IDbranch = IDbranch[0].IDbranch
                    }
                    let branchCCterminalType = await GlobalFunction.getFields('sapakBranches' , 'branchCCterminalType' , "WHERE IDbranch ='"+ IDbranch +"'")
                    if(branchCCterminalType != 'notFound'){
                        branchCCterminalType = branchCCterminalType[0].branchCCterminalType
                    }

                    if(branchCCterminalType == 'tranzila'){
                        option.index = paymentReference1.index
                        option.ConfirmationCode = paymentReference1.ConfirmationCode
                        option.ccExpiration = paymentReference1.expdate
                    }

                    if(branchCCterminalType == 'cardcom'){
                        option.index = paymentReference1.ApprovalNumber
                        option.ConfirmationCode = paymentReference1.Token
                        option.ccExpiration = ccExpiration
                    }

                    //getPayGama גאמא שולף פרטים בפונקציה  

                    // ResultData.DebitApproveNumber
                    // ResultData.Token
                    if(branchCCterminalType == 'gama'){
                        option.iskaMaxPayments = paymentReference1.ResultData.TotalPayments
                        option.authorizationNumber = paymentReference1.ResultData.DebitApproveNumber
                        option.token =  paymentReference1.ResultData.Token
                        option.currency =  paymentReference1.ResultData.DebitCurrency
                    }

                    // J5 חיוב האשראי ב 
                    let tarzres = await GlobalFunction.getPay(IDbranch , option)                    
                    
                    newPaymentStatus = 1
                    if (tarzres.status != 'success') 
                        { 
                            newPaymentStatus = 2
                            allPaymentsInStatus1 = false
                        }
                    //to do: sending to gama for all of the clients of the order. They get invoices from gama  
                    else 
                        if(branchCCterminalType == 'gama')
                        {
                            respInvoice = await GetInvoiceGama(IDorder,option);
                            console.log("GetInvoiceGama -> respInvoice ", respInvoice);
                        }    
                        // if(branchCCterminalType == 'gama')
                        // {
                            // console.log("GetInvoiceGama->response_sdf1sdf");
                        

                    // --- מעדכן סטטוס תשלום בהתאם, עבר או נכשל ---                       
                    Pool.query('UPDATE payments SET paymentStatus='+newPaymentStatus+' WHERE IDpayment='+IDpayment, async (err, rs2 ,fields) => {
                        //console.log(rs2, err)
                        if (rs2.affectedRows>0) { console.log('updated payment status to '+newPaymentStatus) }
                        else { console.log('*FAILED* to update payment status') }
                    })
                    newOrderStatus = 50     // שולמה במלואה
                    if (newPaymentStatus==2) { newOrderStatus = 10 }    // חיוב נכשל
                    Pool.query('UPDATE orders SET orderStatus='+newOrderStatus+' WHERE IDorder='+IDorder+' AND IDpayment='+IDpayment, async (err, rs ,fields) => {
                        //console.log(rs, err)
                        if (rs.affectedRows>0) { console.log('updated (sub)order status') }
                        else { console.log('*FAILED* to update (sub)order status') }
                    })
                })
            }
            
            msg = '[[pp10PersonalLink]]'
            if (!allPaymentsInStatus1) {
                // --- חלק מהתשלומים נכשלו ---
                IDcustomerMain = 0
                if (!orderIsPrimary) { 
                    // --- זוהי הזמנה משנית, שולף מספר טלפון של מארגן ההזמנה ---
                    rs =  await GlobalFunction.getFields('orders','IDcustomer',"WHERE IDorder='"+IDorder+"' AND IDsubOrder=1 LIMIT 1")
                    if (rs!='notFound') { IDcustomerMain = rs[0].IDcustomer }
                    rs =  await  GlobalFunction.getFields('customers','customerPhoneNumber',"WHERE IDcustomer='"+IDcustomerMain+"'")
                    if (rs!='notFound') { customerPhoneNumber = rs[0].customerPhoneNumber }
                }
                // --- שולח הודעה אל מארגן ההזמנה, או אל המזמין המשלם כרגע אם הוא המארגן ---
                rs =  await  GlobalFunction.getFields('systemMessages','msgContent',"WHERE IDmsg=1034 AND msgLang='"+pLang+"'")
                if (rs!='notFound') { msg = rs[0].msgContent }
                msg = msg.replace('[[IDorder]]', IDorder)
                msg = msg.replace('[[pp10PersonalLink]]', pp10PersonalLinkEncoded)
                await  GlobalFunction.sendSMS(customerPhoneNumber , msg)
            } else {
                // --- כל התשלומים חוייבו בהצלחה,  כל ההזמנות (ראשית+משניות) כבר בסטטוס 50 שולמה במלואה ---
                orderMovedToStatus50 = true
                //if (!orderIsPrimary) {
                    // --- שולח אל המארגן + כל המשתתפים הודעה שההזמנה הושלמה  ---
                    Pool.query('SELECT c.IDcustomer, c.customerPhoneNumber, o.IDorder FROM customers as c LEFT JOIN orders as o ON (c.IDcustomer=o.IDcustomer) WHERE IDorder='+IDorder, async (err, rs2 ,Fields) => {
                        //console.log(rs2, err)
                        if (rs2.length>0) {
                            let customerPhoneNumberACC = '|'
                            let msgBase = '[[pp10PersonalLink]]'
                            IDmsg = 1033
                            // if (iskaType=='auction') { IDmsg = 1039 } // לא נכנסים לפונקציה במצב מכרזה
                            console.log('IDmsg to send: '+IDmsg, 'iskaType recognized inside block is: '+iskaType)
                            rs3 =  await GlobalFunction.getFields('systemMessages','msgContent',"WHERE IDmsg='"+IDmsg+"' AND msgLang='"+pLang+"'")
                            if (rs3!='notFound') { msgBase = rs3[0].msgContent }
                            //msgBase = msgBase.replace('[[IDorder]]', rs2[0].IDorder)
                            rs2.forEach(async (element) => {
                                console.log(element.IDorder, element.IDcustomer, element.customerPhoneNumber)
                                pp10linkPerParticipant =  await GlobalFunction.setRoute(process.env.pBaseURL+'/pp11/'+element.IDorder+'/'+element.IDcustomer)
                                console.log('pp10linkPerParticipant='+pp10linkPerParticipant.url+'\n\n\n\n')
                                msg = msgBase.replace('[[pp10PersonalLink]]', pp10linkPerParticipant.url)
                                if (customerPhoneNumberACC.indexOf('|'+element.customerPhoneNumber+'|')==-1) {
                                    await GlobalFunction.sendSMS(element.customerPhoneNumber , msg)
                                    customerPhoneNumberACC += element.customerPhoneNumber+'|'
                                }
                            })
                        }
                    })
                //}
            }
        }

        resolve(
            {
                "orderMovedToStatus50" : orderMovedToStatus50,
                respInvoice
            })
        
    })
}



const saveTempChairs = async function(TempChair){  
    return new Promise(async(resolve, reject) => {
        console.log(TempChair);
        let IDiska = TempChair.IDiska
        let IDinlay = TempChair.IDinlay
        let chairsSelected = TempChair.chairsSelected

        let IDhall = await GlobalFunction.getFields('halls' , 'IDhall' , "WHERE IDIskaot like '%"+IDiska+"%'")

        if(IDhall != 'notFound'){
            IDhall = IDhall[0].IDhall
        }else{
            IDhall = 0
        }

        let timeStamp = format(new Date(Date.now()), "yyyy-MM-dd HH:mm:ss")
        

        let sql = "INSERT INTO chairs (IDchair, IDhall, IDiska , IDinlay ,IDorder ,timeStamp) VALUES"

        chairsSelected.forEach(element => {
            sql += "(" + element + "," + IDhall + "," + IDiska + "," + IDinlay + ",0,'" + timeStamp + "'),"
        });

        sql = sql.slice(0, -1) 

        Pool.query(sql, (err, row, fields) => {
            if(err){
                console.log(err);
                reject(err)
            }
            if(row.affectedRows > 0){
                resolve({status:'success' })
            }else{
                resolve({status:'err' })
            }
        })
    })
}


const deleteTempChairs = async function(TempChair){  
    return new Promise(async(resolve, reject) => {
        let sql = ''
        TempChair.chairsSelected.forEach(IDchair => {
            sql+= "DELETE FROM `chairs` WHERE "
            sql+= 'IDchair = ' + IDchair + ' AND IDiska = ' + TempChair.IDiska + ' AND IDinlay = ' + TempChair.IDinlay + ';'
        });
        console.log(sql);
        if(sql){
            Pool.query(sql, (err, row, fields) => {
                if(err){
                    console.log(err);
                    reject(err)
                }
                resolve({status:'success' })
            })
        }else{
            resolve({status:'success' })

        }
    
    })
}
// TempChair = { IDiska: 8388521, IDinlay: 29852, chairsSelected: [ 225, 226, 227 ] }
// deleteTempChairs(TempChair)

// LocalStorge in Server
const { v4: uuidv4 } = require('uuid');
const { object } = require('underscore');
const SaveIskaFromLocalStorge = async function(data,uuid){  
    return new Promise(async(resolve, reject) => {
        // data = cryptr.encrypt(data)
        console.log('uuid' , uuid)
        // return
        if(uuid){
            console.log('temporarySessions update' , uuid);
            Pool.query("UPDATE `temporarySessions` SET `temporarySessionData`=(?) WHERE temporarySessionID = (?)",[data,uuid], (err, row, fields) => {
                if(err){console.log(err);}
                // console.log(row);
                if(row.affectedRows== 0){
                    let uuid = uuidv4()
                    console.log('temporarySessions INSERT' , uuid);
                    Pool.query("INSERT INTO `temporarySessions`(`temporarySessionID`, `temporarySessionData`) VALUES ((?),(?))",[uuid,data], (err, row, fields) => {
                        if(err){console.log(err);}
                        resolve({status:'success' , uuid:uuid})
                    })
                }else{
                    resolve({status:'success' , uuid:uuid})
                }
            })
        }else{
            let uuid = uuidv4()
            console.log('temporarySessions INSERT' , uuid);
            Pool.query("INSERT INTO `temporarySessions`(`temporarySessionID`, `temporarySessionData`) VALUES ((?),(?))",[uuid,data], (err, row, fields) => {
                if(err){console.log(err);}
                resolve({status:'success' , uuid:uuid})
            })
        }
    })
}

const DeleteIskaFromLocalStorge = async function(uuid){  
    return new Promise(async(resolve, reject) => {
        Pool.query("DELETE FROM `temporarySessions` WHERE temporarySessionID = (?)",[uuid], (err, row, fields) => {
            if(err){console.log(err);}
            resolve({status:'success'})
        })
    })
}

const loadIskaFromLocalStorge = async function(uuid){  
    return new Promise(async(resolve, reject) => {
        Pool.query("SELECT `temporarySessionData` FROM `temporarySessions` WHERE `temporarySessionID` = (?)",[uuid], (err, row, fields) => {
            if(err){
               console.log(err);
            }
            if(row.length > 0){
                let data = row[0].temporarySessionData
                // data = cryptr.decrypt(data)
                // console.log(data);
                resolve({status : 'success' , data:data})
                return
            }
                resolve({status : 'err'})
        })
    })
}

const setFractionNumber = async function(numerator, denominator){  
    return new Promise(async(resolve, reject) => {
        let sfnResult
        if (numerator % denominator != 0) {
            sfnResult = (numerator).toString()+'/'+(denominator).toString()
        } else {
            sfnResult = numerator/denominator
        }    
        resolve(sfnResult)
    })
}

const getShipmentDetails = async function(oShipType, oShipID){  
    return new Promise(async(resolve, reject) => {
        /*
        --- מחשבת ומחזירה עלות של משלוח לפי שני השדות שמתקבלים ---
        oShipType options: 
        0. none, שני המשתנים או אחד מהם מגיעים כ null
        1. free (חינם), ואז אין משמעות לשדה oShipID
        2. self-pickup (איסוף עצמי) ואז שדה oShipID יופיע מזהה סניף (IDbranch) ממנו בחר לאסוף
        3. regular-shipment (משלוח רגיל) ואז בשדה oShipID יופיע מזהה המשלוח (IDshipment) שבחר
        */
       console.log('getShipmentDetails' , oShipType, oShipID);
        if (!oShipType) {
            resolve('')
            return
        }
        shipmentPrice = 0
        shipmentName = ''
        branchAddress = ''
        branchPhone = ''
        branchOpenHours = ''

        if (oShipType=='self-pickup') {
            shipmentName = 'איסוף עצמי'
            rsgsd = await GlobalFunction.getFields('sapakBranches' , 'branchName, branchAddress, branchPhone, branchOpenHours' , "WHERE IDbranch = '" + oShipID + "' LIMIT 1")   
            if (rsgsd!='notFound') {
                shipmentName = shipmentName + ' מסניף ' + rsgsd[0].branchName
                branchAddress = rsgsd[0].branchAddress
                branchPhone = rsgsd[0].branchPhone
                branchOpenHours = rsgsd[0].branchOpenHours
            }
        } else if (oShipType=='regular-shipment') {
            rsgsd = await GlobalFunction.getFields('shipments' , 'shipmentName, shipmentPrice' , "WHERE IDshipment = '" + oShipID + "' LIMIT 1")   
            if (rsgsd!='notFound') {
                shipmentName = rsgsd[0].shipmentName
                shipmentPrice = rsgsd[0].shipmentPrice
            } else {
                shipmentName = 'משלוח'
                shipmentPrice = '0'
            }
        }
        details = ''
        if (branchAddress!='') { details += branchAddress }
        if (branchPhone!='') { if (details!='') { details += ', '; } details += branchPhone }
        if (branchOpenHours!='') { if (details!='') { details += ', '; } details += branchOpenHours }
        console.log('getShipmentDetails('+oShipType+', '+oShipID+') -> ', shipmentName, shipmentPrice )
        // example for required result: [{"type":"regular-shipment", "id":"4", "cost":"50", "name":"משלוח מהיר עם שליח", "details":"יופץ במהלך שעות העבודה"}] 
        resolve({ "type": oShipType, "id": oShipID, "cost": shipmentPrice, "name":shipmentName, "details": details })
    })
}





const getAllExtrasFood = async function(IDiska){  
    return new Promise(async(resolve, reject) => {
        Pool.query("SELECT fopi.*,fo.* FROM `featureOptionsPerIska` as fopi LEFT JOIN featureOptions as fo on(fopi.IDfo = fo.IDfo) WHERE fo.IDfg = 0 AND fopi.IDiska = (?)",[IDiska], (err, row, fields) => { 
            row.forEach(element => {
                element.foPhotoFile = '/uploads/users/' + element.IDsapak + '/upsale/' + element.foPhotoFile
            });
            resolve(row)
        })
    })
}




module.exports ={
    getLastIska , getIskaHeaderDetails , getFeatureOptions , getIskaFooterDetails , getMoreIskaot , getDeliveryDetails , SendUserVerificationCode , UserVerificationCode , validateCouponViaServer , getAllUpSaleByIDiska , getAllinlayByIdIskaAndIDinlay , AddOrder ,getOrderDetailsForPP10 , getOrderDetailsForPP11, DeleteTickets , getQuantityDiscount , GetFeatureOptionsGroupByIDiska, CheckAndCompleteOrder, getValidShippingAddress , getAllExtrasFood,
    SaveIskaFromLocalStorge,
    DeleteIskaFromLocalStorge,
    loadIskaFromLocalStorge,
    getTicketTypes,saveTempChairs,deleteTempChairs,
    setFractionNumber,
    getShipmentDetails
}