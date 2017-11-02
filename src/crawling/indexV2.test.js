import index from "./indexV2"
import { combineReducers, createStore } from "redux"
import { logReducers, LogToConsole } from "../reducers/logReducers"
import TinyPage from "../utils/page/TinyPage"
import TrackTime from "../utils/trackTime"

//////
;(async () => {
  const store = createStore(combineReducers({ logState: logReducers }))
  const _index = index(() => ({ categoriesSlice: 4 }), store.dispatch)
  const t = TrackTime()
  t.start()

  LogToConsole(store)

  const TEST_CASE = "Crawling V2"
  const _ = console.log

  try {
    await _index()
    const pass = true
    // _(`[RECHECK PASS] First command: ${JSON.stringify(commands[0], null, 2)}`)
    return pass ? _(`\x1b[42m[PASS]\x1b[0m ${TEST_CASE}`) : _(`\x1b[41m[FAIL]\x1b[0m ${TEST_CASE}`)
  } catch (err) {
    _(err)
    return _(`\x1b[41m[FAIL]\x1b[0m ${TEST_CASE}`)
  } finally {
    await TinyPage.closeBrowser()
    t.end()
  }
})()
