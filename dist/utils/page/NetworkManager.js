"use strict"

const logWithInfo = require("../log/logInfo")
// www.google-analytics.com
const NetworkManager = async page => {
  await page.setRequestInterceptionEnabled(true)
  const requestList = []
  page.on("request", req => {
    requestList.push(req)
    //noinspection JSUnresolvedVariable
    const url = req.url
    const asJPG = url.endsWith(".jpg")
    const asPNG = url.endsWith(".jpg")
    const googleAnalytics = url.includes("google-analytics")
    const shouldAbort = asJPG || asPNG || googleAnalytics

    if (shouldAbort) {
      //noinspection JSUnresolvedFunction
      req.abort()
      return
    }

    //noinspection JSUnresolvedFunction
    req.continue()
  })
  // page.on("console", msg => console.log(msg))
  return {
    log() {
      logWithInfo(`[NetworkManager] Total request: ${requestList.length}`)
    },
    getAllRequest() {
      return requestList
    },
    getPage() {
      return page
    }
  }
}

module.exports = NetworkManager
