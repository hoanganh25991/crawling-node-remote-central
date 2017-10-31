import readDescription from "./readDescription"
import { combineReducers, createStore } from "redux"
import { reducers as readDescriptionReducers } from "./readDescription"
;(async () => {
  const store = createStore(combineReducers({ readState: readDescriptionReducers }))
  const _readDescription = readDescription(store.dispatch)

  store.subscribe(() => {
    const state = store.getState()
    const msg = state.readState && state.readState.log && state.readState.log.msg
    console.log(msg)
  })

  const TEST_CASE = `Read description`
  const _ = console.log

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
