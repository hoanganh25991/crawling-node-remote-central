const puppeteer = require("puppeteer")
const { puppeteer: puppeteerConf } = require("../config")
const NetworkManager = require("./NetworkManager")
const { logDebug } = require("../log")

let browser

const getBrowser = async () => {
  if (browser) return browser
  browser = await puppeteer.launch(puppeteerConf.launch)
  return browser
}

const TinyPage = async (options = {}) => {
  const { needNewOne } = options
  if (needNewOne) {
    // logDebug(`Try to close previous browser`, 0, "\x1b[41m%s\x1b[0m")
    // await browser.close()
    logDebug(`Open new browser`, 0, "\x1b[41m%s\x1b[0m")
    browser = await puppeteer.launch(puppeteerConf.launch)
  }
  const _browser = await getBrowser()
  //noinspection JSUnresolvedVariable
  const page = await _browser.newPage()
  await NetworkManager(page)
  return page
}

TinyPage.closeBrowser = async () => {
  let _browser = await getBrowser()
  await _browser.close()
}

process.on("beforeExit", async () => {
  await browser.close()
})

module.exports = TinyPage
