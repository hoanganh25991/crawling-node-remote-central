import puppeteer from "puppeteer"
import compose from "../compose"

const openDefaultPage = async browser => await browser.newPage()

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

const addPageRunFunction = page => {
  if (!page.runFunction) page.runFunction = callback => callback()
  return page
}

const config = {
  timeout: 30000,
  args: ["--no-sandbox", "--disable-setuid-sandbox"]
}

let browser = null
let firstRun = true
let browserPromise = null
const initBrowser = mergedOption => {
  if (!firstRun && browserPromise) {
    return browserPromise
  }

  firstRun = false
  return (browserPromise = puppeteer.launch(mergedOption))
}

/**
 * Create tiny page
 * @param option
 * @returns {Promise.<*>}
 * @constructor
 */
export const TinyPage = async (option = {}) => {
  const mergedOption = Object.assign({}, config, option)
  if (!browser) browser = await initBrowser(mergedOption)
  const tinyPage = await compose(addPageRunFunction, ignoreImgRequest, openDefaultPage)
  return await tinyPage(browser)
}

TinyPage.closeBrowser = async () => {
  if (browser) await browser.close()
  browser = null
}

TinyPage.injectBrowser = _browser => (browser = _browser)

TinyPage.initBrowser = async (option = {}) => {
  const mergedOption = Object.assign({}, config, option)
  if (!browser) browser = await puppeteer.launch(mergedOption)
}

export default TinyPage
