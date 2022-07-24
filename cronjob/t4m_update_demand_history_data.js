/**************** CRONTAB EVERY NIGHT AT ~00:10-00:35 ****************/

// window development
// set NODE_ENV=development&& node t4m_update_demand_history_data
// linux prod
// export NODE_ENV=prod&& node t4m_update_demand_history_data

switch (process.env.NODE_ENV) {
    case 'development':
        console.log('run on development Mode');
        require('dotenv').config({ path: './../config/.env' });
        break;
    case 'prod':
        console.log('run on production Mode');
        require('dotenv').config({ path: './../config/.envProd' });
        break;
    }

const Pool = require('./../core/db/dbPool')
const GlobalFunction = require('./../helpers/admin/GlobalFunction');
 

// rs = await GlobalFunction.getFields('systemMessages','msgContent',"WHERE IDmsg=1035 AND msgLang='he'") // can use 'he' language
// if (rs!='notFound') { baseMSG = rs[0].msgContent }
// let msg = baseMSG

    
    var demandHistory = []
    var accDH = "|"
    
    async function calculateAndUpdateDemandHistoryData(){
        console.log("start of calculateAndUpdateDemandHistoryData()")
        let DHdata = await getIskaot() // waits for getIskaot to complete before moving to the next line
        let SQLquery = await runCalculations(DHdata) // similarly waits for the completion of runCalculations
        console.log(SQLquery)
        
        if (SQLquery) {

            console.log('got SQL Insert data, deleting old data from table')
            // --- ניקוי הטבלה מכל החישובים הקודמים, בתחילת הריצה נמחקות כל הרשומות מטבלת היסטוריית הביקושים --- מתבצע בסוף רק אם כל החישובים מוצלחים וניתן לשמור לטבלה, אחרת אם נתקע ולא הגיע לפה לא ימחק נתונים ---
            Pool.query("DELETE FROM demandHistory", function (err, inlData) {
                if (err) throw err;
            });
            
            console.log('data deleted, now inserting new data into table')
            await runInsertSQLquery(SQLquery)
            console.log('done inserting new data')
            
        } else {
            
            console.log('something went WRONG! nothing is done!')

        }
        
        console.log("end of calculateAndUpdateDemandHistoryData()")
    }
    

    // ===================================================
    calculateAndUpdateDemandHistoryData()
    // ===================================================
    

    async function runInsertSQLquery(SQLquery)
    {
        return new Promise((resolve, reject) => {
            Pool.query(SQLquery, function (err, dhData) {
                if (err) { console.log('ERROR: ',err) }
                resolve()
            })
        })
    }


    async function getIskaot(){
        
        return new Promise((resolve, reject) => {
            
            // -- משיכת כל העסקאות בפעילות להן מוגדר יקור או הוזלה או שניהם --
            let SQLquery = 'SELECT IDiska, dynamicPriceDiscount, dynamicPriceRaise FROM iskaot WHERE isActive=1 AND (dynamicPriceDiscount<>0 OR dynamicPriceRaise<>0) ORDER BY IDiska LIMIT 12'
            Pool.query(SQLquery, async function (err, result) {
                if (err) throw err;
                
                let IDiska
                let dynamicPriceDiscount
                let dynamicPriceRaise 
            
                // rs = await GlobalFunction.getFields('systemMessages','msgContent',"WHERE IDmsg=1034 AND msgLang='he'") // can use 'he' language
                // if (rs!='notFound') { baseMSG = rs[0].msgContent }
                // let msg = baseMSG
                
                await result.forEachAsync(async (element) => {
                    
                    dynamicPriceDiscount    = element.dynamicPriceDiscount
                    dynamicPriceRaise       = element.dynamicPriceRaise
                    // -- משיכת כל הסבבים של כל עסקה חודשיים אחורה וספירת מספר הכרטיסים שהוזמנו בכל שעה בשבוע --
                    IDiska = element.IDiska
                    console.log ('10. getIskaot -> ', IDiska)
                    
                    await getDemandHistoryPerIska(IDiska, dynamicPriceDiscount, dynamicPriceRaise)
                    
                    })
                    resolve({demandHistory})
                })
             
            })
    }
    
    async function getDemandHistoryPerIska(IDiska, dynamicPriceDiscount, dynamicPriceRaise) {
        
        return new Promise((resolve, reject) => {

        let ticketsOrdered, tmpDHkey
        let maxTicketsOrdered = 0
        let minTicketsOrdered = 0
        
        let SQLquery2 = "SELECT ord.orderTicketsTotal, ord.IDinlay, inl.inlaySchedule, WEEKDAY(inl.inlaySchedule) as weekDay, HOUR(inl.inlaySchedule) as timeFrame FROM orders as ord LEFT JOIN inlays as inl ON (ord.IDinlay=inl.IDinlay) WHERE inl.inlaySchedule>= DATE_ADD(NOW(), INTERVAL -60 DAY) AND ord.orderTicketsTotal<>'' AND ord.IDiska='" + IDiska + "' ORDER BY ord.IDiska, WEEKDAY(inl.inlaySchedule), HOUR(inl.inlaySchedule)"
        
        console.log (SQLquery2)
        
        Pool.query(SQLquery2,async function (err, inlData) {
            // if (err) {
        //     throw err;
        // }  // else { console.log(inlData) }
        
        await inlData.forEachAsync(async (inlElement) => {
            
            console.log ('20. getDemandHistoryPerIska -> ', IDiska, inlElement.inlaySchedule)
            //console.log (inlElement)

            ticketsOrdered = 0
            if(GlobalFunction.IsJsonString(inlElement.orderTicketsTotal)) {
                oua = JSON.parse(inlElement.orderTicketsTotal)
                ticketsOrdered = parseInt(oua[0].quantity)
                tmpDHkey =  String(IDiska+"-"+ inlElement.weekDay+"-"+ inlElement.timeFrame)
                
                //await sleep(100);
                
                if ( accDH.indexOf('|'+tmpDHkey+'|')!=-1 ) {
                    // -- יש כבר במערך את העסקה הזו ביום ובשעה הזו, נעדכן את מספר ההזמנות באיבר הקיים --
                    for (iixX=0; iixX<demandHistory.length; iixX++)   {
                        if (demandHistory[iixX].key == tmpDHkey) {
                            demandHistory[iixX].ticketsOrdered = parseInt(demandHistory[iixX].ticketsOrdered) + parseInt(ticketsOrdered)
                            // -- בודק ומעדכן מינימום ומקסימום כרטיסים שהוזמנו בקומבינציית יום\שעה כלשהי --
                            if (parseInt(demandHistory[iixX].ticketsOrdered) < parseInt(minTicketsOrdered)) { minTicketsOrdered = parseInt(demandHistory[iixX].ticketsOrdered) }
                            if (parseInt(demandHistory[iixX].ticketsOrdered) > parseInt(maxTicketsOrdered)) { maxTicketsOrdered = parseInt(demandHistory[iixX].ticketsOrdered) }
                            iixX = demandHistory.length + 5
                        }
                    }
                    console.log('30A. adding to existing combination of weekDay/timeFrame')
                    //await sleep(700);
                } else {
                    // -- זו פעם ראשונה שנתקלים בעסקה הזו ביום ובשעה הזו, ניצור איבר חדש במערך --
                    demandHistory.push({ key: tmpDHkey, ticketsOrdered: ticketsOrdered, calculatedFactor: 1 })
                    accDH += tmpDHkey+'|'
                    console.log('30B. new weekDay/timeFrame combination')
                    // -- בודק ומעדכן מינימום ומקסימום כרטיסים שהוזמנו בקומבינציית יום\שעה כלשהי --
                    if (parseInt(ticketsOrdered) < parseInt(minTicketsOrdered)) { minTicketsOrdered = ticketsOrdered }
                    if (parseInt(ticketsOrdered) > parseInt(maxTicketsOrdered)) { maxTicketsOrdered = ticketsOrdered }
                    }
                    
                    //console.log('tmpDHkey = ', tmpDHkey, 'maxTicketsOrdered = ', maxTicketsOrdered)
                }
                
            })
            
            demandHistory.push({ key: String(IDiska), maxTicketsOrdered: maxTicketsOrdered, minTicketsOrdered: minTicketsOrdered, dynamicPriceDiscount: dynamicPriceDiscount, dynamicPriceRaise: dynamicPriceRaise })
            resolve()
        })
        
        //console.log('30C. maxTicketsOrdered = ', maxTicketsOrdered)
        
    })
}

async function runCalculations(DHdata) {
    return new Promise((resolve, reject) => {
        
        console.log('40. runCalculations(DHdata) DHdata.lenght = ', DHdata.demandHistory.length)
        
        let SQLinsertData = ''
        let IDiska, ticketsOrdered,  weekDay, timeFrame, maxTicketsOrdered, minTicketsOrdered, calculatedFactor

        for (ii=0; ii<DHdata.demandHistory.length; ii++) {
            if (DHdata.demandHistory[ii].maxTicketsOrdered) {
                IDiska = DHdata.demandHistory[ii].key
                maxTicketsOrdered = DHdata.demandHistory[ii].maxTicketsOrdered
                minTicketsOrdered = DHdata.demandHistory[ii].minTicketsOrdered
                dynamicPriceDiscount = DHdata.demandHistory[ii].dynamicPriceDiscount
                dynamicPriceRaise = DHdata.demandHistory[ii].dynamicPriceRaise
                
                iskaHistory = DHdata.demandHistory.filter(element => {
                    return element.key.startsWith(IDiska+'-') 
                })
                
                //console.log(iskaHistory , '=====', iskaHistory.length,)

                for (isix=0; isix<iskaHistory.length; isix++) {
                    ticketsOrdered = iskaHistory[isix].ticketsOrdered
                    tmpWT = iskaHistory[isix].key.replace(IDiska+'-','').split('-')
                    weekDay = tmpWT[0]
                    timeFrame = tmpWT[1]

                    // ---------------------------------------
                    // הנוסחה לחישוב פקטור בכל יום\שעה היא:
                    // -- (מספר ההזמנות באותו יום ובאותה שעה בחודשיים האחרונים לחלק ב (במקסימום כרטיסים שהוזמנו פחות מינימום כרטיסים שהוזמנו) כפול ((100 ועוד אחוז יקור מכסימלי) פחות (100 פחות אחוז הוזלה מינימלי)) ועוד (100 פחות אחוז הוזלה מינימלי)) הכל לחלק ב 100
                    calculatedFactor = (((ticketsOrdered / (maxTicketsOrdered - minTicketsOrdered)) * ((100+dynamicPriceRaise)-(100-dynamicPriceDiscount)) + (100-dynamicPriceDiscount))/100).toFixed(2)
                    // ---------------------------------------

                    //SQLinsertData += " INSERT INTO demandHistory (IDiska, weekDay, timeFrame, ticketsOrdered, calculatedFactor) VALUES ('"+IDiska+"','"+weekDay+"','"+timeFrame+"','"+ticketsOrdered+"','"+calculatedFactor+"'); "
                    // SQLinsertData += " INSERT INTO demandHistory (IDiska, weekDay, timeFrame, ticketsOrdered, calculatedFactor) VALUES ("+IDiska+","+weekDay+","+timeFrame+","+ticketsOrdered+","+calculatedFactor+"); "

                    if (SQLinsertData=='') {
                        SQLinsertData += "INSERT INTO demandHistory (IDiska, weekDay, timeFrame, ticketsOrdered, calculatedFactor) VALUES ("+IDiska+","+weekDay+","+timeFrame+","+ticketsOrdered+","+calculatedFactor+")"
                    } else {
                        SQLinsertData += ", ("+IDiska+","+weekDay+","+timeFrame+","+ticketsOrdered+","+calculatedFactor+")"
                    }
                    
                    //console.log(DHdata.demandHistory[ii],' ---> ',DHdata.demandHistory[ii].key,' --->', weekDay, timeFrame, ' ======= calculatedFactor = ', calculatedFactor)

                }

            }
            
        }
        
        resolve(SQLinsertData)
    })
}
    



   
    
   

    
    
    
    
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    
    
    // async function getDemandHistoryCrossData(IDiska) {
        
    //     return new Promise((resolve, reject) => {

           

    //     resolve()
    // })
    // }

