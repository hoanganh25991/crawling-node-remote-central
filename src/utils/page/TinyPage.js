import puppeteer from "puppeteer"
import compose from "../compose"

const ignoreImgRequest = async page => {
  await page.setRequestInterceptionEnabled(true)
  const requestList = []

  page.on("request", req => {
    requestList.push(req)

    const url = req.url
    const asJPG = url.endsWith(".jpg")
    const asPNG = url.endsWith(".jpg")
    const googleAnalytics = url.includes("google-analytics")
    const shouldAbort = asJPG || asPNG || googleAnalytics

    if (shouldAbort) return req.abort()

    return req.continue()
  })

  if (!page.requestList) page.requestList = () => requestList

  if (!page.requestSummary) page.requestSummary = () => console.log(`[Network] Page hit ${requestList.length} requests`)

  return page
}

const openDefaultPage = async browser => await browser.newPage()

const config = {
  timeout: 30000,
  args: ["--no-sandbox", "--disable-setuid-sandbox"]
}

let browser = null

/**
 * Create tiny page
 * @param option
 * @returns {Promise.<*>}
 * @constructor
 */
const TinyPage = async (option = {}) => {
  const mergedOption = Object.assign({}, config, option)

  if (!browser) browser = await puppeteer.launch(mergedOption)

  const tinyPage = await compose(ignoreImgRequest, openDefaultPage)

  return await tinyPage(browser)
}

TinyPage.closeBrowser = async () => {
  if (browser) await browser.close()
}

module.exports = TinyPage
