
const { trim, lastIndexOf } = require('lodash');
var validator = require('validator');
// https://www.npmjs.com/package/validator




const addCouponsValidators = async function(coupon){  
    let valid = true
    return new Promise((resolve, reject) => {
        if(validator.isEmpty(coupon.couponName)){
            valid = false
        }
        if(!validator.isNumeric(coupon.IDiska.toString())){
            valid = false
        }
        resolve(valid)
    })
}

const EditCouponsValidators = async function(coupon){

}

const AddIskaValidators = async function(iska) {
    let valid = true
    let number_list_regex = /^[0-9]+(,[0-9]+)*$/
    let discount_list_regex = /^[0-9a-zA-Z]+(,[0-9a-zA-Z]+)*$/
    return new Promise((resolve, reject) => {
        if(!validator.isInt(iska.IDsapak.toString()) || validator.isEmpty(iska.IDsapak) || iska.IDsapak == null){
            valid = false
            return resolve(valid)
        }
        if(iska.iskaType == null || validator.isEmpty(iska.iskaType) || !["attraction", "product-food", "professionals", "auction"].includes(iska.iskaType) || !validator.isLength(iska.iskaType, {max: 30})){
            valid = false
            return resolve(valid)
        }
        if(iska.iskaSubType != null){
            if(iska.iskaType == "product-food" && !validator.isAlpha(iska.iskaSubType) || iska.iskaType == "product-food" && !validator.isLength(iska.iskaSubType, {max: 30})){
                valid = false
                return resolve(valid)
            }
        }
        if(iska.iskaCategories == null || validator.isEmpty(iska.iskaCategories) || !number_list_regex.test(iska.iskaCategories.toString()) || !validator.isLength(iska.iskaCategories, {max: 1000})){
            valid = false
            return resolve(valid)
        }
        if(iska.iskaPhotos == null || validator.isEmpty(iska.iskaPhotos) || !validator.isLength(iska.iskaPhotos, {max: 1000})){
            valid = false
            return resolve(valid)
        }
        if(iska.iskaName == null || validator.isEmpty(iska.iskaName) || !validator.isLength(iska.iskaName, {max: 100})){
            valid = false
            return resolve(valid)
        }
        if(iska.iskaDescription == null || validator.isEmpty(iska.iskaDescription) || !validator.isLength(iska.iskaDescription, {max: 250})){
            valid = false
            return resolve(valid)
        }
        if(iska.iskaReadMore == null || validator.isEmpty(iska.iskaReadMore) || !validator.isLength(iska.iskaReadMore, {max: 1000})){
            valid = false
            return resolve(valid)
        }
        if(iska.iskaSmallLetters == null || validator.isEmpty(iska.iskaSmallLetters) || !validator.isLength(iska.iskaSmallLetters, {max: 2000})){
            valid = false
            return resolve(valid)
        }
        if(iska.iskaAbout == null || validator.isEmpty(iska.iskaAbout) || !validator.isLength(iska.iskaAbout, {max: 1000})){
            valid = false
            return resolve(valid)
        }
        if(iska.iskaTakanon == null || validator.isEmpty(iska.iskaTakanon) || !validator.isLength(iska.iskaTakanon, {max: 2000})){
            valid = false
            return resolve(valid)
        }
        if(iska.iskaTakanonFileName == null || !validator.isLength(iska.iskaTakanonFileName, {max: 100})){
            valid = false
            return resolve(valid)
        }
        if(iska.iskaAboutFileName  == null || validator.isEmpty(iska.iskaAboutFileName ) || !validator.isLength(iska.iskaAboutFileName , {max: 2000})){
            valid = false
            return resolve(valid)
        }
        if(iska.iskaAboutFileNameLink == null || validator.isEmpty(iska.iskaAboutFileNameLink) || !validator.isLength(iska.iskaAboutFileNameLink, {max: 2000})){
            valid = false
            return resolve(valid)
        }
        if(iska.iskaCurrency == null || validator.isEmpty(iska.iskaCurrency) || !validator.isLength(iska.iskaCurrency, {max: 10}) || !["ILS", "USD", "EUR"].includes(iska.iskaCurrency)){
            valid = false
            return resolve(valid)
        }
        if(iska.iskaInventory == null || ["auction", "product-food"].includes(iska.iskaType) && !validator.isInt(iska.iskaInventory.toString()) || ["auction", "product-food"].includes(iska.iskaType) && validator.isEmpty(iska.iskaInventory)){
            valid = false
            return resolve(valid)
        }
        if(iska.iskaMaxPayments == null || !validator.isInt(iska.iskaMaxPayments.toString()) || validator.isEmpty(iska.iskaMaxPayments)){
            valid = false
            return resolve(valid)
        }
        if(iska.iskaFriendsShareDiscount == null || !validator.isInt(iska.iskaFriendsShareDiscount.toString()) || validator.isEmpty(iska.iskaFriendsShareDiscount)){
            valid = false
            return resolve(valid)
        }
        if(iska.iskaFriendsReturnDiscount == null || !validator.isInt(iska.iskaFriendsReturnDiscount.toString()) || validator.isEmpty(iska.iskaFriendsReturnDiscount)){
            valid = false
            return resolve(valid)
        }
        if(iska.iskaUpsales == null || iska.iskaType != "auction" && !number_list_regex.test(iska.iskaUpsales.toString()) || iska.iskaType != "auction" && validator.isEmpty(iska.iskaUpsales) || iska.iskaType != "auction" && !validator.isLength(iska.iskaUpsales, {max: 2000})){
            valid = false
            return resolve(valid)
        }
        if(iska.iskaBranches != null || !validator.isEmpty(iska.iskaBranches)){
            if(["auction", "product-food"].includes(iska.iskaType) && !number_list_regex.test(iska.iskaBranches.toString()) || ["auction", "product-food"].includes(iska.iskaType) && !validator.isLength(iska.iskaBranches, {max: 2000})){
                valid = false
                return resolve(valid)
            }
        }
        if(iska.iskaShipments != null || !validator.isEmpty(iska.iskaShipments)){
            if(["auction", "product-food"].includes(iska.iskaType) && !number_list_regex.test(iska.iskaShipments.toString()) || ["auction", "product-food"].includes(iska.iskaType) && !validator.isLength(iska.iskaShipments, {max: 2000})){
                valid = false
                return resolve(valid)
            }
        }

        if(["attraction", "professionals"].includes(iska.iskaType))
        {
            if(iska.ticketTypes != null || !validator.isEmpty(iska.ticketTypes)){
                if(iska.iskaType == "attraction" && !number_list_regex.test(iska.ticketTypes.toString()) || iska.iskaType == "attraction" && !validator.isLength(iska.ticketTypes, {max: 400})){
                    valid = false
                    return resolve(valid)
                }
            }
            if(iska.combinedTickets != null || !validator.isEmpty(iska.combinedTickets)){
                if(iska.iskaType == "attraction" && !number_list_regex.test(iska.combinedTickets.toString()) || iska.iskaType == "attraction" && !validator.isLength(iska.combinedTickets, {max: 400})){
                    valid = false
                    return resolve(valid)
                }
            }
            if(iska.dynamicPriceDiscount != null){
                if(!validator.isInt(iska.dynamicPriceDiscount.toString())){
                    valid = false
                    return resolve(valid)
                }
            }
            if(iska.dynamicPriceRaise != null){
                if(!validator.isInt(iska.dynamicPriceRaise.toString())){
                    valid = false
                    return resolve(valid)
                }
            }
            if(iska.hallWidth != null){
                if(!validator.isInt(iska.hallWidth.toString())){
                    valid = false
                    return resolve(valid)
                }
            }
            if(iska.hallLength != null){
                if(!validator.isInt(iska.hallLength.toString())){
                    valid = false
                    return resolve(valid)
                }
            }
            if(iska.roundTime != null){
                if(!validator.isInt(iska.roundTime.toString())){
                    valid = false
                    return resolve(valid)
                }
            }
            if(iska.reOrganizeTime != null){
                if(!validator.isInt(iska.reOrganizeTime.toString())){
                    valid = false
                    return resolve(valid)
                }
            }
            if(iska.minimumTicketsPerOrder != null){
                if(!validator.isInt(iska.minimumTicketsPerOrder.toString())){
                    valid = false
                    return resolve(valid)
                }
            }
            if(iska.minimumTicketsInFirstOrder != null){
                if(!validator.isInt(iska.minimumTicketsInFirstOrder.toString())){
                    valid = false
                    return resolve(valid)
                }
            }
            if(iska.maximumTicketsPerRound != null){
                if(!validator.isInt(iska.maximumTicketsPerRound.toString())){
                    valid = false
                    return resolve(valid)
                }
            }
        }
        
        if(["product-food", "professionals"].includes(iska.iskaType))
        {
            if(iska.featureGroups != null || !validator.isEmpty(iska.featureGroups)){
                if(!number_list_regex.test(iska.featureGroups.toString()) || !validator.isLength(iska.featureGroups, {max:400})){
                    valid = false
                    return resolve(valid)
                }
            }
            if(iska.basicIskaPrice == null || iska.iskaType == "product-food" && !validator.isFloat(iska.basicIskaPrice.toString()) || iska.iskaType == "product-food" && validator.isEmpty(iska.basicIskaPrice)){
                valid = false
                return resolve(valid)
            }
            if(iska.quantityDiscount == null || iska.iskaType == "product-food" && !discount_list_regex.test(iska.quantityDiscount.toString()) || iska.iskaType == "product-food" && !validator.isLength(iska.quantityDiscount, {max: 1000}) || iska.iskaType == "product-food" && validator.isEmpty(iska.quantityDiscount)){
                valid = false
                return resolve(valid)
            }
        }

        if(iska.iskaType == "auction")
        {
            if(iska.priceImport != null){
                if(iska.priceImport == null || !validator.isFloat(iska.priceImport.toString())){
                    valid = false
                    return resolve(valid)
                }
            }
            if(iska.priceMarket != null){
                if(iska.priceMarket == null || !validator.isFloat(iska.priceMarket.toString())){
                    valid = false
                    return resolve(valid)
                }
            }
            if(iska.priceStore != null){
                if(iska.priceStore == null || !validator.isFloat(iska.priceStore.toString())){
                    valid = false
                    return resolve(valid)
                }
            }
            if(iska.bidMinimumPrice != null){
                if(iska.bidMinimumPrice == null || !validator.isInt(iska.bidMinimumPrice.toString())){
                    valid = false
                    return resolve(valid)
                }
            }
            if(iska.bidParticipateFee != null){
                if(iska.bidParticipateFee == null || !validator.isFloat(iska.bidParticipateFee.toString())){
                    valid = false
                    return resolve(valid)
                }
            }
            if(iska.minimumBidders != null){
                if(iska.minimumBidders == null || !validator.isInt(iska.minimumBidders.toString())){
                    valid = false
                    return resolve(valid)
                }
            }
            if(iska.auctionExpiration != null){
                if(iska.auctionExpiration == null || !validator.isDate(iska.auctionExpiration.toString())){
                    valid = false
                    return resolve(valid)
                }
            }
            
        }
        resolve(valid)

    })
}




module.exports ={
    addCouponsValidators,EditCouponsValidators,AddIskaValidators
}
