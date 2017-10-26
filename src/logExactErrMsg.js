const logWithInfo = require("./logWithInfo")

const logExactErrorMsg = err => {
  if (typeof err === "object" && err.message) logWithInfo(err.message)
  console.log("[ERR]", err)
}

var exports = (module.exports = logExactErrorMsg)
