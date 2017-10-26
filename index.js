const logWithInfo = require("./src/logInfo")
const logExactErrMsg = require("./src/logErr")
const findStore = require("./src/findFilterApiUrl")
const callFoodyApi = require("./src/callFoodyApi")
const sendNotification = require("./src/utils/sendNotification")

const run = async function() {
  await sendNotification("DONE", { headings: { en: "Crawling XXX" } })
  // const pageInfo = await findFilterApiUrl()
  // console.log(pageInfo)
  // const apiUrl = "https://www.foody.vn/ho-chi-minh/an-vat-via-he-tai-quan-2?c=an-vat-via-he"
  // const stores = await callFoodyApi(apiUrl)
}

const crawling = async () => {
  try {
    await run()
  } catch (err) {
    logExactErrMsg(err)
  } finally {
    // Auto re callApiUrl
    // setTimeout(crawling, 6000)
    logWithInfo("==============COMPLETE CRAWLING FOODY==============")

    process.exit()
  }
}

// Ok, start
crawling()
