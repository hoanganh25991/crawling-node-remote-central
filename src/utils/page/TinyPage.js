const compose = require("../compose")

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

  if (!page.getRequestList) page.getRequestList = () => requestList

  if (!page.getRequestSummary)
    page.getRequestSummary = () => console.log(`[Network] Page hit ${requestList.length} requests`)

  return page
}

const openDefaultPage = async browser => await browser.newPage()

const TinyPage = async (browser, options = {}) => {
  const tinyPage = compose(ignoreImgRequest, openDefaultPage)

  return await tinyPage(browser)
}

module.exports = TinyPage
