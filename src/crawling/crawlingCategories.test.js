import crawlingCategories from "./crawlingCategories"
import { combineReducers, createStore } from "redux"
import { logReducers, LogToConsole } from "../reducers/logReducers"
import TinyPage from "../utils/page/TinyPage"
;(async () => {
  const store = createStore(combineReducers({ logState: logReducers }))
  const getState = () => ({})
  const _crawling = crawlingCategories(getState, store.dispatch)
  LogToConsole(store)

  const TEST_CASE = `Crawling categories`
  const _ = console.log

  try {
    const url = "http://files.remotecentral.com/library/3-1/index.html"
    const categories = await _crawling(url)
    const pass = categories.length > 0
    return pass ? _(`\x1b[42m[PASS]\x1b[0m ${TEST_CASE}`) : _(`\x1b[41m[FAIL]\x1b[0m ${TEST_CASE}`)
  } catch (err) {
    _(err)
    return _(`\x1b[41m[FAIL]\x1b[0m ${TEST_CASE}`)
  } finally {
    await TinyPage.closeBrowser()
  }
})()
