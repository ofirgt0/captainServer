var Pool = require('./../../core/db/dbPool')
var validator = require('validator');
var formatDistanceStrict = require('date-fns/formatDistanceStrict')
var addMinutes = require('date-fns/addMinutes')
var getMinutes = require('date-fns/getMinutes')
var addDays = require('date-fns/addDays')
var intervalToDuration  = require('date-fns/intervalToDuration')
var parseISO = require('date-fns/parseISO')
var format = require('date-fns/format')
var startOfMonth = require('date-fns/startOfMonth')
var endOfMonth = require('date-fns/endOfMonth')
var GlobalFunction = require('./GlobalFunction')
var iskaotHelper = require('./iskaotHelper')
const _ = require('underscore');


const getDaySelectedByMonth = async function(IDsapak,IDiska,MonthStartDay){  
    return new Promise(async (resolve, reject) => {
        MonthStartDay = new Date(MonthStartDay)
        console.log(IDsapak,IDiska,MonthStartDay);
        let myStartOfMonth = format(startOfMonth(MonthStartDay),'yyyy-MM-dd')
        let myEndOfMonth = format(endOfMonth(MonthStartDay),'yyyy-MM-dd')

        Pool.query('SELECT inlaySchedule FROM `inlays` WHERE IDsapak = (?) AND IDiska = (?) AND inlaySchedule >= (?) AND inlaySchedule <= (?) GROUP BY CAST(inlaySchedule AS DATE) ',[IDsapak,IDiska,myStartOfMonth,myEndOfMonth], async(err, row ,fields) => {
            if (err) return reject(err);
            // console.log(row);

            await row.forEachAsync(async(element) => {
                element.inlaySchedule = await format(element.inlaySchedule,'yyyy-MM-dd') 
            });

            resolve({status : 'success' , data : row})            
        })
    })
}


const checkeIfDayIsFree = async function(IDiska,dateToCheck){
    return new Promise(async (resolve, reject) => {
        let sql = "SELECT IDinlay FROM inlays WHERE IDiska=(?) AND inlaySchedule >= '"+dateToCheck+" 00:00:00' AND inlaySchedule <= '"+dateToCheck+" 23:59:59'"
        Pool.query(sql,[IDiska], (err, row ,fields) => {
            if (err) return reject(err);
            if(row.length > 0){
                resolve(false)
            }else{
                resolve(true)  
            }
        })
    })
}


const getAllCalendarsByIdSapak = async function(IDsapak){  
    return new Promise(async (resolve, reject) => {
        Pool.query("SELECT IDiska,iskaName FROM `iskaot` WHERE (iskaType = 'professionals' or iskaType = 'attraction') AND IDsapak = (?)",[IDsapak], (err, row ,fields) => {
            if (err) return reject(err);
            if(row.length > 0){
                resolve({status : 'success' , data : row})
            }else{
                resolve({status : 'err'})
            }
        })
    })
}

const DuplicateWeek = async function(IDsapak,IDiska,weekStartDate){  
    return new Promise(async (resolve, reject) => {
        weekStartDate = format(new Date(weekStartDate), "yyyy-MM-dd 00:00:00")        
        
        for (let daysLoop = 0; daysLoop < 7; daysLoop++) {
            let dayToCopy = format(new Date(addDays(new Date(weekStartDate), daysLoop)), "yyyy-MM-dd")
            let dateToCheck = format(new Date(addDays(new Date(weekStartDate), daysLoop + 7)), "yyyy-MM-dd")
            // console.log(dayToCopy , dateToCheck);
            let res = await checkeIfDayIsFree(IDiska,dateToCheck)
            if(res){
                // let sql = "INSERT INTO inlays (IDsapak, IDIska, inlaySchedule, isActive, isBrake) SELECT IDsapak, IDIska, DATE_ADD(inlaySchedule, INTERVAL 7 DAY), isActive, isBrake FROM inlays WHERE inlaySchedule>='"+weekStartDate+"' AND inlaySchedule<=DATE_ADD('"+weekStartDate+"', INTERVAL 7 DAY) AND IDiska="+IDiska
                let sql = "INSERT INTO inlays (IDsapak, IDIska, inlaySchedule, isActive, isBrake) SELECT IDsapak, IDIska, DATE_ADD(inlaySchedule, INTERVAL 7 DAY), isActive, isBrake FROM inlays WHERE inlaySchedule>='"+dayToCopy+" 00:00:00' AND inlaySchedule<='"+dayToCopy+" 23:59:59' AND IDiska="+IDiska
                console.log(sql);
                Pool.query(sql, (err, row ,fields) => {
                    if (err) return reject(err);
                    // console.log(err, row);
              
                })
            }
        }
        resolve({status : 'success'})

    })
}

const changeMaximumTickets = async function(IDsapak,IDiska,maximumTicketsPerRound){  
    return new Promise(async (resolve, reject) => {
        console.log(IDsapak,IDiska,maximumTicketsPerRound);
        Pool.query('UPDATE iskaot SET maximumTicketsPerRound = (?) WHERE IDsapak = (?) AND IDiska = (?);',[maximumTicketsPerRound,IDsapak,IDiska], (err, res ,fields) => {
            if(err){
                reject(err)
                console.log(err);
            }
            
            resolve({status : 'success'})
        })


    })
}


const Stop_or_ReleaseRound = async function(IDsapak,IDiska,IDinlay){  
    return new Promise(async (resolve, reject) => {
  
    Pool.query('select isActive,isBrake FROM inlays WHERE IDsapak = (?) And IDiska = (?) AND IDinlay = (?);',[IDsapak,IDiska,IDinlay], (err, res ,fields) => {
        if(res[0].isBrake != 0){
            resolve({status : 'err' , errNum : 232})
        }
        let isActive = !res[0].isActive
        Pool.query('UPDATE inlays SET isActive = (?) WHERE IDsapak = (?) And IDiska = (?) AND IDinlay = (?);',[isActive,IDsapak,IDiska,IDinlay], (err, row ,fields) => {
            if (err) return reject(err);
            if(row.affectedRows > 0){
                resolve({status : 'success'})
            }else{
                resolve({status : 'err'})
            }
        })
    })


    })
}
// Pool.query('select isBrake FROM inlays WHERE IDsapak = (?) And IDiska = (?) AND IDinlay = (?);',[IDsapak,IDiska,IDinlay], (err, res ,fields) => {
// })
       

const deleteBrake = async function(IDsapak,IDiska,IDinlay){  
    return new Promise(async (resolve, reject) => {
            Pool.query('DELETE from inlays WHERE IDsapak = (?) AND IDiska = (?) AND IDinlay = (?) AND isBrake > 0',[IDsapak,IDiska,IDinlay], (err, row ,fields) => {
                if (err) return reject(err);
                if(row.affectedRows > 0){
                    resolve({status : 'success'})
                }else{
                    resolve({status : 'err'})
                }
            })
        })
}

const addBrake = async function(IDsapak,IDiska,breakStart,TotalTime){  
    return new Promise(async (resolve, reject) => {

        let TotalTimeForRound = await getTotalTimeForRound(IDsapak,IDiska)
        if(TotalTimeForRound.status == 'err'){
            TotalTimeForRound = parseInt(TotalTime.roundTime) + parseInt(TotalTime.reOrganizeTime)
        }else if(TotalTimeForRound.status == 'success'){
            TotalTimeForRound = TotalTimeForRound.TotalTime
        }else{
            resolve({status : 'err'})
        }
 
        //let breakEnd = addMinutes(new Date(breakStart) , 15)

        let dateStart = new Date(addMinutes(parseISO(breakStart) , parseInt(TotalTimeForRound)*-1))
        let dateEnd = new Date(addMinutes(parseISO(breakStart) , 15))

        console.log(breakStart, dateStart, dateEnd, TotalTimeForRound)

        
        //Pool.query("select * FROM inlays WHERE IDsapak = (?) AND IDiska = (?) And (inlaySchedule >= (?) And inlaySchedule <=(?)) OR (DATE_ADD('"+breakStart+"', INTERVAL "+TotalTimeForRound+" MINUTE) >= (?) AND DATE_ADD('"+breakStart+"', INTERVAL "+TotalTimeForRound+" MINUTE)<=(?));",[IDsapak,IDiska,breakStart,breakEnd,breakStart,breakEnd], (err, res ,fields) => {
        Pool.query("select * FROM inlays WHERE IDsapak = (?) AND IDiska = (?) AND inlaySchedule > (?) AND inlaySchedule <(?);",[IDsapak,IDiska,dateStart,dateEnd], (err, res ,fields) => {
            
            if (err){
                console.log(err);
                return reject(err);
            } 
            if(res.length > 0){
                console.log(res);
                resolve({status : 'err'})
                return
            };


            Pool.query('INSERT INTO `inlays` (`IDsapak`, `IDIska`, `inlaySchedule`, `isActive`, `isBrake`) VALUES ((?),(?),(?),(1),(?))',[IDsapak,IDiska,breakStart,TotalTimeForRound], (err, row ,fields) => {
                if (err){
                    console.log(err);
                    return reject(err);
                } 
                // console.log(row);
                if(row.affectedRows > 0){
                    resolve({status : 'success'})
                }else{
                    resolve({status : 'err'})
                }
            })
        })
    })
}

const addOneRound = async function(IDsapak,IDiska,dateStr){  
    return new Promise(async (resolve, reject) => {
        let TotalTimeForRound = await getTotalTimeForRound(IDsapak,IDiska) 
        console.log('TotalTimeForRound -> ' , TotalTimeForRound);
        let dateStart = new Date(addMinutes(parseISO(dateStr) , parseInt(TotalTimeForRound.TotalTime)*-1))
        let dateEnd = new Date(addMinutes(parseISO(dateStr) , TotalTimeForRound.TotalTime))
        
        // console.log('===>' , IDsapak,IDiska,dateStr,'st='+dateStart,'en='+dateEnd);     
        // console.log('dateStr' , dateStr)               
        
            Pool.query('select * FROM inlays WHERE IDsapak = (?) AND IDiska = (?) And inlaySchedule > (?) And inlaySchedule < (?);',[IDsapak,IDiska,dateStart,dateEnd], (err, res ,fields) => {
                if (err){
                    console.log(err);
                } 
                console.log(res);
                if(res.length > 0){
                    resolve({status : 'err'})
                    return
                };

                Pool.query('INSERT INTO `inlays`(`IDsapak`, `IDIska`, `inlaySchedule`, `isActive`, `isBrake`) VALUES ((?),(?),(?),(1),(0))',[IDsapak,IDiska,dateStr], (err, row ,fields) => {
                    if (err) return reject(err);
                    if(row.affectedRows > 0){
                        resolve({status : 'success'})
                    }else{
                        resolve({status : 'err'})
                    }
                })   
          
        })
    })
}

const deleteOneRound = async function(IDsapak,IDiska,IDinlay){  
    return new Promise(async (resolve, reject) => {
        Pool.query("SELECT IDorder FROM orders WHERE orderStatus IN (10,40,50,60,70,80) AND IDinlay=(?)",[IDinlay], (err, rowCanBeDelete ,fields) => {
            if (err) { console.log(err); return reject(err) };
            if(rowCanBeDelete.length > 0){
                // קיימות הזמנות בסבב אין אפשרות לןמחוק אותו
                resolve({status : 'err' , details:'Orders exist in inlay'})
            }else{
                Pool.query('DELETE from inlays WHERE IDsapak = (?) AND IDiska = (?) AND IDinlay = (?)',[IDsapak,IDiska,IDinlay], (err, row ,fields) => {
                    if (err) { console.log(err); return reject(err) };
                    if(row.affectedRows > 0){
                        resolve({status : 'success'})
                    }else{
                        resolve({status : 'err'})
                    }
                })
            }
        })
    })
}

const getTotalTimeForRound = async function(IDsapak,IDiska){  
    return new Promise(async (resolve, reject) => {
        Pool.query('select roundTime,reOrganizeTime from iskaot WHERE IDsapak=(?) AND IDiska = (?)',[IDsapak,IDiska], (err, row ,fields) => {
            if(row.length > 0){
                let TotalTime
                console.log('roundTime' , row[0].roundTime);
                if(row[0].roundTime && validator.isNumeric(row[0].roundTime.toString()) && validator.isNumeric(row[0].reOrganizeTime.toString())){
                    TotalTime = parseInt(row[0].roundTime) + parseInt(row[0].reOrganizeTime)
                }else{
                    TotalTime = '00:15:00'
                }
                resolve({status : 'success' , TotalTime:TotalTime})
            }else{
                resolve({status : 'err' , details:'No records found'})
            }
        })
    })
}


const getAllinlayByIdIska = async function(IDsapak,IDiska,firstWeekDay,TotalTimeForRound_first){  
  
    return new Promise(async (resolve, reject) => {
    
    let needInsertData = await GlobalFunction.getFields('inlays','IDinlay',"WHERE IDsapak = '" +IDsapak+ "' AND IDiska = '" + IDiska +"' LIMIT 3")
    // console.log('needInsertData = ' , needInsertData);
    if(needInsertData == 'notFound'){
        resolve({status : 'needInsertData'})
        return
    }

    currentDate = format(new Date(), "yyyy-MM-dd HH:mm:ss") ; 
    let firstActualDate = await GlobalFunction.getFields('inlays','min(inlaySchedule)',`WHERE IDsapak = '${IDsapak}' AND IDiska = '${IDiska}' and inlaySchedule>='${currentDate}'`);
    if(Array.isArray(firstActualDate) && firstActualDate.length){
        firstActualDate = firstActualDate[0];
    }else
    {
        firstActualDate=null;
    }

    console.log(IDsapak,IDiska,firstWeekDay,TotalTimeForRound_first)
    // -- firstWeekDay = תאריך של יום ראשון שמצג ביומן, הפונקציה מחזירה נתונים עבר שבוע אחד בלבד כל פעם, רק לשבוע שמוצג כרגע ביומן --
    firstWeekDay = format(new Date(firstWeekDay), "yyyy-MM-dd 00:00:00")
    let lastWeekDay = format(new Date(addDays(new Date(firstWeekDay), 6)), "yyyy-MM-dd 23:59:59")
               
    
        let SQLquery = "SELECT IDinlay, inlaySchedule, isActive, isBrake FROM inlays WHERE IDsapak=(?) AND IDiska = (?) AND inlaySchedule>='"+firstWeekDay+"' AND inlaySchedule<='"+lastWeekDay+"' ORDER BY inlaySchedule"
        Pool.query(SQLquery,[IDsapak,IDiska],async (err, row ,fields) => {            
            // console.log(row)
            summeryInfo = []
            let sumQuantity = 0
            let sumCost = 0
            let sumDate = 0
            let inlaysInfo = []
            if (err){
                console.log(err);
                return reject(err);
            } 
            if(row.length > 0){
                let TotalTimeForRound
                if(TotalTimeForRound_first){
                    TotalTimeForRound = TotalTimeForRound_first
                }else{                    
                    TotalTimeForRound = await getTotalTimeForRound(IDsapak,IDiska)
                    TotalTimeForRound = TotalTimeForRound.TotalTime
                }
                await row.forEachAsync(async(element) => {
                    if (summeryInfo.length==0 && sumDate=='') {
                        sumDate = parseInt(parseInt(element.inlaySchedule.getDay())+1)
                    }
                    if (parseInt(sumDate)!=parseInt(parseInt(element.inlaySchedule.getDay())+1)) {
                        summeryInfo.push({"sumDate": sumDate, "sumQuantity": sumQuantity, "sumCost": sumCost})
                        sumQuantity = 0
                        sumCost = 0
                        sumDate = parseInt(parseInt(element.inlaySchedule.getDay())+1)
                        console.log('pushed - sumDate:'+sumDate+', sumQuantity:'+sumQuantity+', sumCost:'+sumCost)
                    }
 
                    let className                                         
                    if(element.isBrake > 0){
                        // הפסקה פעילה
                        className = 'isBrake'
                    }else if(element.isBrake == 0 && element.isActive){
                        // רשומת יומן פעילה
                        className = 'activityActive'
                    }else if(element.isBrake == 0 && !element.isActive){
                        // רשומת יומן לא פעילה
                        className = 'activity'
                    }
                    let TempTotalTimeForRound
                    let myTitle
                    if(element.isBrake > 0){
                        // מצב הפסקה
                        myTitle = 'הפסקה'
                        TempTotalTimeForRound = element.isBrake
                    }else{
                        
                        let rs = await GlobalFunction.getFields('orders','orderTicketsPaid',"WHERE IDinlay='"+element.IDinlay+"' AND (orderStatus=40 OR orderStatus=50)")
                        if(rs=='notFound') {
                            myTitle = '0 / 0.00 ₪'
                        } else {
                            let paidTicketsQuantity = 0
                            let paidTicketsCost = 0
                            rs.forEach(fld => {
                                if(GlobalFunction.IsJsonString(fld.orderTicketsPaid)) {
                                    oua = JSON.parse(fld.orderTicketsPaid)
                                    for (ii=0; ii<oua.length; ii++) { 
                                        paidTicketsQuantity = paidTicketsQuantity + parseInt(oua[ii].quantity) 
                                        paidTicketsCost = paidTicketsCost + parseFloat(oua[ii].cost) 
                                        sumQuantity = sumQuantity + parseInt(oua[ii].quantity)
                                        sumCost = sumCost + parseFloat(oua[ii].cost)
                                    } 
                                } 
                            });
                            console.log('sumQuantity = '+sumQuantity)
                            paidTicketsCost = (paidTicketsCost).toFixed(2)
                            myTitle = paidTicketsQuantity.toString()+' / '+paidTicketsCost.toString()+' ₪'
                            element.paidTickets = paidTicketsQuantity
                        }

                        TempTotalTimeForRound = TotalTimeForRound
                    }
                    
                    inlaysInfo.push({ 
                        date : element.inlaySchedule, 
                        IDinlay : element.IDinlay, 
                        title : myTitle, 
                        className: className ,
                        start:element.inlaySchedule ,
                        end:addMinutes(new Date(element.inlaySchedule), TempTotalTimeForRound),
                        description: 'second description',
                        paidTicketsQuantity: element.paidTickets,
                        })
                })
                summeryInfo.push({"sumDate": sumDate, "sumQuantity": sumQuantity, "sumCost": sumCost})

               
                // הוספת סיכום ריק למערך במקרה שאין פעילויות לאותו יום
                for (let i = 1; i < 8; i++) {
                    let res = summeryInfo.find(x => x.sumDate === i)
                    if(!res){
                        summeryInfo.push({"sumDate": i, "sumQuantity": 0, "sumCost": 0})
                    }
                }
                summeryInfo = _.sortBy( summeryInfo, function( item ) { return item.sumDate; } )
                
      
                
                //console.log('inlaysInfo='+inlaysInfo)     // זה כל המידע של כל הסבבים שיש להציג ביומן
                //console.log('summeryInfo='+JSON.stringify(summeryInfo))    // זה סיכום כמות וכסף של כל יום ביומן
                // let TotalTimeForRound = await getTotalTimeForRound(IDsapak,IDiska)
                // TotalTimeForRound  = TotalTimeForRound.TotalTime
                console.log(TotalTimeForRound);
                TotalTimeForRound = num2time(TotalTimeForRound)

                let rs2 = await GlobalFunction.getFields('iskaot' , 'iskaType,basicIskaPrice' , "WHERE IDiska = '" + IDiska + "'")
                let iskaType = rs2[0].iskaType
                let basicIskaPrice = rs2[0].basicIskaPrice
                console.log('iskaType' , iskaType);
                if(iskaType == 'attraction' || iskaType == 'professionals'){
                    //calculatedFactor הוספה של 
                    let demandHistory =  await GlobalFunction.getFields('demandHistory','weekDay,timeFrame,calculatedFactor','WHERE IDiska='+IDiska + ' order by weekDay , timeFrame')
                    demandHistory = JSON.stringify(demandHistory)
                    demandHistory = JSON.parse(demandHistory)
    
                    await inlaysInfo.forEachAsync(async(element) => {
                      
                        let ils = new Date (element.date)
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
                        // element.calculatedFactor = calculatedFactor
                        element.basicIskaPrice = basicIskaPrice * calculatedFactor
                        element.calculatedFactor = calculatedFactor
                        
                        element.soldOut = false
                        let minimumTicketsPerOrder = await GlobalFunction.getMinimumForOrder(element.IDinlay)
                        let MaxAvailableTickets = await GlobalFunction.getInlayMaxAvailableTickets(element.IDinlay)
                        if(MaxAvailableTickets < minimumTicketsPerOrder){
                            element.soldOut = true
                            element.className = "soldOut"
                          
                        }
                
                        // בדיקה שיש כרטיסים במלאי אם אין מסמן דגל וצובע את הרשומה ביומן בכהה

                        // element.soldOut = 1
                       
                    });
    
                    console.log('demandHistory' ,demandHistory);
                    
                    // ***********************************************************
                }
                // ***********************************************************
                resolve({status : 'success' , data:inlaysInfo , TotalTimeForRound:TotalTimeForRound , summeryInfo:summeryInfo, firstActualDate})
                
            }else{

                TotalTimeForRound = await getTotalTimeForRound(IDsapak,IDiska)
                TotalTimeForRound = num2time(TotalTimeForRound.TotalTime)
                resolve({status : 'err' , details:'No records found' , TotalTimeForRound:TotalTimeForRound, firstActualDate})
            }
        
        })
        
    })
}


function num2time(num){
    num = num * 60
    var sec_num = parseInt(num); // don't forget the second param
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    if(isNaN(hours) || isNaN(minutes) || isNaN(seconds)  ){
        return '00:15:00'
    }

    return hours+':'+minutes+':'+seconds;
  }

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

const deleteDay = async function(IDiska,dayToDelete){  
    return new Promise((resolve, reject) => {

        startDay = dayToDelete + ' 00:00:00'
        endDay = dayToDelete + ' 23:59:59'

        Pool.query('DELETE FROM `inlays` where IDIska = (?) AND inlaySchedule > (?) AND inlaySchedule < (?)',[IDiska,startDay,endDay], async(err, row ,fields) => {
            if (err){
                console.log(err);
                return reject(err);
            } 
            console.log(row);
            resolve({status : 'success'})
     
        }) 
    })
}

const addFirstInlays = async function(IDsapak,CalendarInlays,Setting_up_rounds){  
    console.log(CalendarInlays);
    return new Promise(async (resolve, reject) => {

        // מצב שלא מגיע ערך ב מינימום משתתפים בכל סבב או ב מינימום כרטיסים לרכישה בהזמנה ראשונה בכל סבב
        // מאפס את הערך של המשתנה
        if(Setting_up_rounds.minimumTicketsPerOrder){
            Setting_up_rounds.minimumTicketsPerOrder = parseInt(Setting_up_rounds.minimumTicketsPerOrder)
            Setting_up_rounds.minimumTicketsInFirstOrder = 0
        }else{
            Setting_up_rounds.minimumTicketsInFirstOrder = parseInt(Setting_up_rounds.minimumTicketsInFirstOrder)
            Setting_up_rounds.minimumTicketsPerOrder = 0
        }
         
        // המרה למספר
        Setting_up_rounds.roundTime = parseInt(Setting_up_rounds.roundTime)
        Setting_up_rounds.reOrganizeTime = parseInt(Setting_up_rounds.reOrganizeTime)
        Setting_up_rounds.maximumTicketsPerRound = parseInt(Setting_up_rounds.maximumTicketsPerRound)
        /**
         * הכנסה לטבלת עסקאות 
         */

        Pool.query('UPDATE iskaot SET roundTime = (?), reOrganizeTime = (?), minimumTicketsPerOrder = (?), minimumTicketsInFirstOrder = (?), maximumTicketsPerRound = (?) WHERE IDsapak = (?) And IDiska = (?);',[Setting_up_rounds.roundTime,Setting_up_rounds.reOrganizeTime,Setting_up_rounds.minimumTicketsPerOrder,Setting_up_rounds.minimumTicketsInFirstOrder,Setting_up_rounds.maximumTicketsPerRound,IDsapak,Setting_up_rounds.IDiska], (err, row ,fields) => {
            if (err){
                // console.log(row);
                reject(err)
            }
        })
        
        // מחיקה של כל האירועים ביומן לפני סקריפט יצירה אוטומטית של ערכים ביומן
        Pool.query('DELETE FROM inlays WHERE IDiska = (?);',[Setting_up_rounds.IDiska], (err, row ,fields) => {
            if (err){
                console.log(err);
                reject(err)
            }


        /**
         * הכנסה של רשומות ליומן
         */
        let sql = 'INSERT INTO `inlays` (`IDinlay`, `IDsapak`, `IDiska`, `inlaySchedule`, `isActive`, `isBrake`) VALUES '
        let Sqlparams = ''
        let tmpSqlParams = ""
        const TotalTimeForRound = parseInt(Setting_up_rounds.roundTime) + parseInt(Setting_up_rounds.reOrganizeTime)
        for (let i = 0; i < CalendarInlays.length; i++) {
            //ללואה לחיבור ההפסקות לזמן תקין
            CalendarInlays[i].brake.forEach(brake => {
                if(brake.startTime_hour && brake.endTime_hour){
                    brake.mybrakeStart = brake.startTime_hour +':'+ brake.startTime_Minute 
                    brake.mybrakeEnd = brake.endTime_hour +':'+ brake.endTime_Minute
                }
            });

            for (let z = 0; z < CalendarInlays[i].date.length; z++) {
                for (let b = 0; b < CalendarInlays[i].brake.length; b++) {
                    //  להוסיף תנאי רק אם יש הפסקה
                    if(CalendarInlays[i].brake[b].mybrakeStart && CalendarInlays[i].brake[b].mybrakeEnd){
                        let brakeStart = CalendarInlays[i].date[z] + ' ' + CalendarInlays[i].brake[b].mybrakeStart 
                        brakeStart = format(new Date(brakeStart), "yyyy-MM-dd HH:mm:ss")
                        let brakeEnd = CalendarInlays[i].date[z] + ' ' +  CalendarInlays[i].brake[b].mybrakeEnd                       
                        brakeEnd = format(new Date(brakeEnd), "yyyy-MM-dd HH:mm:ss")
                        let DistanceResult = formatDistanceStrict(new Date(brakeStart),new Date(brakeEnd),{  unit: 'minute' , addSuffix:false })
                        DistanceResult = DistanceResult.split(' ')
                        DistanceResult = parseInt(DistanceResult[0])
                        // הוספה של רשומות פעילות ליומן
                        while (DistanceResult >= TotalTimeForRound) {
                            let roundTime = format(new Date(brakeStart), "yyyy-MM-dd HH:mm:ss")
                            tmpSqlParams = "(NULL,'"+IDsapak+"','"+Setting_up_rounds.IDiska+"','"+roundTime+"','1','0'),"
                            if (Sqlparams.indexOf(tmpSqlParams)==-1) { Sqlparams += tmpSqlParams }
                            brakeStart = addMinutes(new Date(brakeStart), TotalTimeForRound)
                            DistanceResult -= TotalTimeForRound
                        }
                        
                        // הוספה של הפסקות ליומן
                        if(CalendarInlays[i].brake[b].mybrakeStart && CalendarInlays[i].brake[b + 1] && CalendarInlays[i].brake[b + 1].mybrakeEnd){
                            
                            let mybrakeEnd = CalendarInlays[i].date[z] +' '+ CalendarInlays[i].brake[b].mybrakeEnd
                            let myNextBrakeStart = CalendarInlays[i].date[z] +' '+ CalendarInlays[i].brake[b + 1].mybrakeStart
                             
                            
                            myNextBrakeStart = format(new Date(myNextBrakeStart), "yyyy-MM-dd HH:mm:ss")
                            mybrakeEnd = format(new Date(mybrakeEnd), "yyyy-MM-dd HH:mm:ss")
                            
 
                            let DistanceResult = formatDistanceStrict(new Date(myNextBrakeStart),new Date(mybrakeEnd),{  unit: 'minute' , addSuffix:false })
                            DistanceResult = DistanceResult.split(' ')
                            DistanceResult = parseInt(DistanceResult[0])
                            tmpSqlParams = "(NULL,'"+IDsapak+"','"+Setting_up_rounds.IDiska+"','"+mybrakeEnd+"','1','"+DistanceResult+"'),"
                            if (Sqlparams.indexOf(tmpSqlParams)==-1) { Sqlparams += tmpSqlParams }
                        }
                    }
                }     
            }
        }
        
        mySql = sql + Sqlparams.slice(0, -1)
        console.log(mySql);
        if(Sqlparams == ""){
            resolve({status : 'err' , details:'הנתונים שהזנת לא מאפשרים הזנת סבבים'})
            return
        }
        // console.log(mySql);

        Pool.query(mySql,async (err, row ,fields) => {
            if (err){
                console.log(err);
                return reject(err);
            } 
    
                resolve({status : 'success'})
        
        })
        



        })

       

    })
}



module.exports ={
    addFirstInlays , getAllinlayByIdIska , deleteOneRound , addOneRound , addBrake , Stop_or_ReleaseRound , deleteBrake , DuplicateWeek , getAllCalendarsByIdSapak, getDaySelectedByMonth , changeMaximumTickets , getTicketTypes , deleteDay
}