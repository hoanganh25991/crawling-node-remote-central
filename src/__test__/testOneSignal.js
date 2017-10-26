const { appId, apiKey } = require("./../.credential/onesignal.json")
// const oneSignal = require('onesignal')(apiKey, appId, false)
// oneSignal.createNotification("DONE", {included_segments: ["Test Users"]}, ["3741d556-f852-45f1-8165-85864d864397"])
var sendNotification = (content, messageObj = null) => {
  const data = {
    app_id: appId,
    contents: { en: content },
    headings: { en: "Notification" },
    included_segments: ["TestUsers"]
  }
  Object.assign(data, messageObj)
  console.log(data)

  var headers = {
    "Content-Type": "application/json; charset=utf-8",
    Authorization: `Basic ${apiKey}`
  }

  var options = {
    host: "onesignal.com",
    port: 443,
    path: "/api/v1/notifications",
    method: "POST",
    headers: headers
  }

  var https = require("https")
  var req = https.request(options, function(res) {
    res.on("data", function(data) {
      // console.log("Response:");
      //noinspection JSCheckFunctionSignatures
      // console.log(JSON.parse(data));
    })
  })

  req.on("error", function(e) {
    // console.log("ERROR:");
    // console.log(e);
  })

  req.write(JSON.stringify(data))
  req.end()
}

// var message = {
//   app_id: appId,
//   contents: {"en": "DONE"},
//   headings: {"en": "Crawling Foody Stores"},
//   included_segments: ["TestUsers"]
// };
sendNotification("DONE", { headings: { en: "Crawling XXX" } })
var exports = (module.exports = sendNotification)
