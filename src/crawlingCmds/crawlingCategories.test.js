import crawlingCategories from "./crawlingCategories"
import { combineReducers, createStore } from "redux"
import { logReducers, LogToConsole } from "../reducers/logReducers"

;(async () => {
  const store = createStore(combineReducers({ logState: logReducers }))
  const _crawling = crawlingCategories(() => {}, store.dispatch)
  LogToConsole(store)

  const TEST_CASE = `Crawling categories`
  const _ = console.log

  try {
    const url = "http://files.remotecentral.com/library/3-1/index.html"
    const categories = await _crawling(url)

    if (!categories) {
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
