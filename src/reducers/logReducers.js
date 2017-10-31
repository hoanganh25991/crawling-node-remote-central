export const logReducers = (state = { msg: "", level: 0 }, action) => {
  const { type } = action
  switch (type) {
    case "LOG":
    case "LOG_MSG": {
      const { msg } = action
      return { ...state, msg }
    }
    case "INCREASE_LOG_LEVEL": {
      const { level = 0 } = state
      const nextLevel = level + 1
      return { ...state, level: nextLevel }
    }
    case "DECREASE_LOG_LEVEL": {
      const { level = 0 } = state
      const nextLevel = level - 1
      return { ...state, level: nextLevel }
    }
    default: {
      return state
    }
  }
}

export const LogToConsole = store => {
  let lastLogState = null

  store.subscribe(() => {
    const { logState } = store.getState()
    const shouldLog = !lastLogState || lastLogState.msg !== logState.msg

    if (shouldLog) {
      lastLogState = logState
      const msg = (logState && logState.msg) || ""
      const level = (logState && logState.level) || 0
      const paddingLength = level * 2 + 1
      const padding = paddingLength >= 0 ? new Array(paddingLength).join(" ") : ""
      const paddingWithRootSlash = level > 0 ? `${padding}\\__` : padding
      console.log(`${paddingWithRootSlash} ${msg}`)
    }
  })
}
