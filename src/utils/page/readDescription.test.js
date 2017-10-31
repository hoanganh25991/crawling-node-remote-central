import readDescription from "./readDescription"
import { combineReducers, createStore } from "redux"
import { reducers as readDescriptionReducers } from "./readDescription"
import { logReducers, LogToConsole } from "../../reducers/logReducers"

;(async () => {
  const store = createStore(combineReducers({ readState: readDescriptionReducers, logState: logReducers }))

  const readDescriptionState = () => {
    const { readState } = store.getState()
    return readState
  }

  const _readDescription = readDescription(readDescriptionState, store.dispatch)

  LogToConsole(store)

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
    _(err)
  } finally {
    process.exit()
  }
})()
