const store = require("../store")
const logKey = "_log"
const defaultState = {
  logLevel: 1,
  spaceIndent: 2
}

const initLogState = () => {
  store.setState({ [logKey]: defaultState })
  return defaultState
}

const getState = () => {
  let { [logKey]: currState } = store.getState()
  if (!currState) {
    currState = initLogState()
  }
  return currState
}

const getPadding = state => {
  const { logLevel, spaceIndent } = state
  return Array(logLevel * spaceIndent + 1).join(" ")
}

const updateState = (nextState = null) => {
  const currState = getState()
  const state = Object.assign({}, currState, nextState)
  store.setState({ [logKey]: state })
  return state
}

const logInfo = (nextState = null) => (logs, style = "%s") => {
  const state = updateState(nextState)
  const padding = getPadding(state)
  const paddingWithRootSlash = state.logLevel > 0 ? `${padding}\\__` : padding

  const isArr = Array.isArray(logs)
  const isStr = typeof logs === "string"

  switch (true) {
    case isArr: {
      console.log(style, `[INFO] ${paddingWithRootSlash}`, ...logs)
      break
    }
    case isStr: {
      console.log(style, `[INFO] ${paddingWithRootSlash}${logs}`)
      break
    }
    default: {
      console.log(style, `[INFO] ${paddingWithRootSlash}`, logs)
      break
    }
  }
}

logInfo.indent = addUp => {
  const currState = getState()
  const { logLevel: curr } = currState
  const logLevel = curr + addUp
  const state = Object.assign({}, currState, { logLevel })
  store.setState({ [logKey]: state })
  return state
}

module.exports = logInfo
