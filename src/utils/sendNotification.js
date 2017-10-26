const { appId, apiKey } = require("./../.credential/onesignal.json")

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

const sendNotification = (content, messageObj = null) => {
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

module.exports = sendNotification
