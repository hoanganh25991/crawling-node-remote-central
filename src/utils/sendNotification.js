const { appId, apiKey } = require("./onesignal.config.json")

const options = {
  host: "onesignal.com",
  port: 443,
  path: "/api/v1/notifications",
  method: "POST",
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    Authorization: `Basic ${apiKey}`
  }
}

const data = {
  app_id: appId,
  included_segments: ["TestUsers"]
}

/**
 * Send notification by OneSingal
 * @param content
 * @param messageObj
 * @returns {Promise}
 */
export const sendNotification = (content, messageObj = null) => {
  // Merge
  Object.assign(
    data,
    {
      headings: { en: "Notification" },
      contents: { en: content }
    },
    messageObj
  )

  const https = require("https")
  const req = https.request(options)
  req.write(JSON.stringify(data))
  const waitReqFinish = new Promise(resolve => req.end(resolve))
  return waitReqFinish
}

export default sendNotification
