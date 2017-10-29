"use strict"

const logInfo = require("./logInfo")
const logSingleLine = require("single-line-log").stdout
const limit = 50

const logAwait = async (callback, taskName = "No task name") => {
  console.time(taskName)
  let count = 0
  const timeId = setInterval(() => {
    count++

    if (count > limit) {
      count = 0
    }
    var percentage = Math.floor(100 * count / limit)
    const percent = Array(count + 1).join("#")
    const padding = logInfo.getPadding()
    logSingleLine(`${padding}${taskName}\n${padding}[${percentage}%]`, percent)
  }, 500)
  const result = await callback()
  clearInterval(timeId)
  console.timeEnd(taskName)
  logSingleLine.clear()
  return result
}

module.exports = logAwait
