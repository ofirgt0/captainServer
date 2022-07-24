const GlobalFunction = require('./GlobalFunction');
var Pool = require('./../../core/db/dbPool')

const getAllCouponsByIDiska = async function(IDiska){  
        return new Promise((resolve, reject) => {
            Pool.query('SELECT IDcoupon,couponName,CouponDiscount,couponCode,couponCounter,couponMaxUsage FROM coupons WHERE IDiska = (?);',[IDiska], (err, row ,fields) => {
                if (err) return reject(err);
                if(row.length > 0){
                    resolve({status : 'success' , data:row })
                }
                    resolve({status : 'err'})
            })
    })
}

const addCouponToIska = async function(IDsapak,coupon){  

    return new Promise(async (resolve, reject) => {
        let allGood = true
        let NumberOfcoupons = coupon.NumberOfcoupons
        // לתקן - להוציא את השאילתה מהלולאה כרגע אפשרי עד 250 קופונים ביחד
        let tempCouponArr = []
        for (let i = 0; i < NumberOfcoupons; i++) {
            tempCouponArr.push(i)
        }

        let arrParam=[];
        let first =  true;
        let sql = "INSERT INTO coupons (IDsapak, IDiska, couponName, CouponDiscount, couponCode, couponCounter, couponMaxUsage) VALUES "
        await tempCouponArr.forEachAsync(async(element) => {
            coupon.couponCode = await GlobalFunction.getRandNumber(7 , 'coupons' , 'couponCode')
            sql+= (!first ? ", ": '')+"( (?), (?), (?), (?), (?), (?), (?) )";
            first = false;
            arrParam.push(IDsapak,coupon.IDiska,coupon.couponName,coupon.CouponDiscount,coupon.couponCode,0,coupon.couponMaxUsage);
            // sql +="('" +IDsapak +"','"+ coupon.IDiska +"','"+ JSON.stringify(coupon.couponName) +"','"+ coupon.CouponDiscount +"','"+ coupon.couponCode +"'," + 0 +",'" + coupon.couponMaxUsage + "'),"
        });
        // sql = sql.slice(0, -1)
        Pool.query(sql, arrParam, async (err, row ,fields) => {
            if (err) {
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



const deleteCoupon = async function(IDcoupon){  
    return new Promise((resolve, reject) => {
        Pool.query('DELETE FROM coupons WHERE IDcoupon = (?);',[IDcoupon], (err, row ,fields) => {
            if (err) return reject(err);
            if(row.affectedRows > 0){
                resolve({status : 'success'})
            }else{
                resolve({status : 'err'})
            }
        })
    })
}


const deleteCouponByGroup = async function(AllIDcoupon){  
    return new Promise((resolve, reject) => {

        Pool.query('DELETE FROM coupons WHERE IDcoupon IN ('+AllIDcoupon+');', (err, row ,fields) => {
            if (err) return reject(err);
            if(row.affectedRows > 0){
                resolve({status : 'success'})
            }else{
                resolve({status : 'err'})
            }
        })
    })
}







module.exports ={
    // ...
    addCouponToIska,deleteCoupon,getAllCouponsByIDiska,deleteCouponByGroup
}