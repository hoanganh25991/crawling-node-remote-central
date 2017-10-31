import crawlingCategories from "./crawlingCategories"
import crawlingCmds from "./crawlingCmds"
import { combineReducers, createStore } from "redux"
import { logReducers, LogToConsole } from "../reducers/logReducers"
import TinyPage from "../utils/page/TinyPage"
;(async () => {
  const store = createStore(combineReducers({ logState: logReducers }))
  LogToConsole(store)

  const getState = () => {}
  const _crawlingCategories = crawlingCategories(getState, store.dispatch)
  const _crawlingCmds = crawlingCmds(getState, store.dispatch)

  const TEST_CASE = "Crawling"
  const _ = console.log

  try {
    const url = "http://files.remotecentral.com/library/3-1/index.html"
    const categories = await _crawlingCategories(url)

    const testCategories = categories.slice(0, 4)
    const commands = await _crawlingCmds(testCategories)

    const pass = commands.length > 0
    _(`First command: ${JSON.stringify(commands[0], null, 2)}`)
    return pass ? _(`\x1b[42m[PASS]\x1b[0m ${TEST_CASE}`) : _(`\x1b[41m[FAIL]\x1b[0m ${TEST_CASE}`)
  } catch (err) {
    _(err)
    return _(`\x1b[41m[FAIL]\x1b[0m ${TEST_CASE}`)
  } finally {
    await TinyPage.closeBrowser()
  }
})()
