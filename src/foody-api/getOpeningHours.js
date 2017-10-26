const { TinyPage } = require("../page")
const urlEndPoint = "https://www.foody.vn"
const { logDebug } = require("../log")
const { puppeteer: { retryLimit } } = require("../config")

const getOpeningHours = limit => async storeDetailUrl => {
  let hasError = false
  let retryCount = 0
  do {
    try {
      // if (retryCount) logDebug(`[RETRY] ${retryCount} times, at url: ${storeDetailUrl}`, 2, "\x1b[41m%s\x1b[0m")
      const url = `${urlEndPoint}${storeDetailUrl}`
      // logDebug(url, 2)

      const options = retryCount >= 1 ? { needNewOne: true } : {}
      const page = await TinyPage(options)

      await page.goto(url, { timeout: 30 * 1000 })
      const activeTime = await page.evaluate(async () => {
        const activeTimeSpan = document.querySelector("div.micro-timesopen > span:nth-child(3)")
        const activeTimeStr = activeTimeSpan.innerText
        const activeTime = activeTimeStr.match(/(\d{2}:\d{2})/gi)
        return activeTime
      })
      page.close()
      return activeTime ? activeTime : [null, null]
    } catch (err) {
      hasError = true
    } finally {
      retryCount++
    }
  } while (hasError && retryCount <= limit)

  // logDebug(`Fail to find OpeningHours return as [null, null]`, 0, "\x1b[41m%s\x1b[0m")
  return [null, null]
}

// (async () => {
//   const aactiveTime = await getOpeningHours("/ho-chi-minh/mato-house-taiwan-healthy-tea")
//   console.log(aactiveTime)
// })()

module.exports = getOpeningHours(retryLimit)
