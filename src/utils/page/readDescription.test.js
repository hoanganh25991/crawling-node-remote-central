import readDescription from "./readDescription"
import { combineReducers, createStore } from "redux"

import { iniState as readState, reducers as readReducers } from "./readDescription"
;(async () => {
  const reducers = combineReducers({ readState: readReducers })
  const store = createStore(reducers)
  const _readDescription = readDescription(store.dispatch)

  store.subscribe(() => console.log(store.getState().readState.log.msg))

  try {
    const crawlingTitle = [
      {
        title: `Go to google.com`,
        goto: `https://www.google.com.vn`
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

    if (!pass) return console.log(`\x1b[41m[FAIL]\x1b[0m Read description fail!`)

    return console.log(`\x1b[42m[PASS]\x1b[0m Read description`)
  } catch (err) {
    console.log(err)
  } finally {
    process.exit()
  }
})()
