const fetch = require("isomorphic-fetch")

/**
 * Call foody GET API
 * @param apiUrl
 ex:
 https://www.foody.vn/__get/Review/ResLoadMore?ResId=46554&isLatest=false&Count=1
 */
const callFoodyApi = async (apiUrl, parse = "json") => {
  const res = await fetch(apiUrl, {
    headers: {
      accept: "*/*",
      "User-Agent": "Chrome/59.0.3071.115",
      "X-Foody-User-Token": "La2qAmY6rxB71YgcUruMGPqsyhy5AUUKzfbzuYyyTzr8nevJB9OP56PiNT3p",
      "X-Requested-With": "XMLHttpRequest"
    }
  })
  const resData = await res[parse]()
  return resData
}
module.exports = callFoodyApi
