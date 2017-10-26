const callFoodyApi = require("./callFoodyApi")
const urlEndpoint = `https://www.foody.vn/__get/Restaurant/RestaurantPhone`

/**
 * Get phone number
 * @param storeId
 * @returns {string|null}
 */
const getPhoneNumber = async storeId => {
  const apiUrl = `${urlEndpoint}?resId=${storeId}`
  const res = await callFoodyApi(apiUrl, "text")
  // Foody return as HTML
  // Find out phone-number by regex
  //noinspection JSUnresolvedFunction
  const matchPhoneArr = res.match(/<span.+>(.+)<\/span>/i)
  const phoneNumber = matchPhoneArr ? matchPhoneArr[1] : null
  return phoneNumber
}

module.exports = getPhoneNumber
