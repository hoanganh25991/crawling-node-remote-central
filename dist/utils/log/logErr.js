"use strict"

const _log = console.log
const redBg = "\x1b[31m%s\x1b[0m"

const logErr = err => {
  const hasErrMsg = err && err.message

  !_log(redBg, "[ERR]", err) && hasErrMsg && !_log(redBg, `[ERR] ${err.message}`)
}

module.exports = logErr
