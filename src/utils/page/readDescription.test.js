import readDescription from "./readDescription"
import { combineReducers, createStore } from "redux"
import { reducers as readDescriptionReducers } from "./readDescription"
;(async () => {
  const logReducers = (state = { msg: "", level: 0 }, action) => {
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

  const store = createStore(combineReducers({ readState: readDescriptionReducers, logState: logReducers }))

  const readDescriptionState = () => {
    const state = store.getState()
    const { readState } = state
    return readState
  }

  const _readDescription = readDescription(readDescriptionState, store.dispatch)

  const ListenToLog = () => {
    let lastLogState = null
    store.subscribe(() => {
      const { logState } = store.getState()
      const shouldLog = !lastLogState || lastLogState.msg !== logState.msg
      if (shouldLog) {
        lastLogState = logState
        const msg = (logState && logState.msg) || ""
        const level = (logState && logState.level) || 0
        const padding = new Array(level * 2 + 1).join(" ")
        const paddingWithRootSlash = level > 0 ? `${padding}\\__` : padding
        console.log(`${paddingWithRootSlash} ${msg}`)
      }
    })
  }

  ListenToLog()

  const TEST_CASE = `Read description`
  const _ = console.log

  try {
    const crawlingTitle = [
      {
        title: `Go to google.com`,
        actions: [
          {
            title: `Deep go to page`,
            goto: `https://www.google.com.vn`
          }
        ]
      },
      {
        title: `Get title`,
        evaluate: () => {
          return document.title
        },
        storeReturnAsKey: "pageTitle"
      }
    ]

    const crawlingReturn = await _readDescription(crawlingTitle)
    const { pageTitle } = crawlingReturn
    const pass = pageTitle === "Google"

    if (!pass) {
      return _(`\x1b[41m[FAIL]\x1b[0m ${TEST_CASE}`)
    } else {
      return _(`\x1b[42m[PASS]\x1b[0m ${TEST_CASE}`)
    }
  } catch (err) {
    console.log(err)
  } finally {
    process.exit()
  }
})()
