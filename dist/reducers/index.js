"use strict"

const state = {}
const argv = require("minimist")(process.argv.slice(2))

const getInitState = () => {
  try {
    const initStateFilePath = argv["stateJson"]
    const fullPath = `${__dirname}/../../${initStateFilePath}`
    const initState = require(fullPath)
    return initState
  } catch (err) {
    return {}
  }
}

const initState = getInitState

Object.assign(state, initState)

const store = {
  getState() {
    return state
  },
  setState(obj) {
    Object.assign(state, obj)
  }
}

module.exports = store
