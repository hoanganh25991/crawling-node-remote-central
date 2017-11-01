import index from "../crawling/index"
import { combineReducers, createStore } from "redux"
import { logReducers, LogToConsole } from "../reducers/logReducers"
import TinyPage from "../utils/page/TinyPage"
import firebaseMonitor, { iniState as monitorState } from "./firebaseMonitor"

/////
;(async () => {
  const store = createStore(combineReducers({ logState: logReducers }))
  const _index = index(() => ({ categoriesSlice: 4 }), store.dispatch)

  const getFbState = () => {
    const s = store.getState()
    return { ...s.logState, silentConsoleLog: true }
  }

  firebaseMonitor(getFbState, store)
  LogToConsole(store)

  const TEST_CASE = "Crawling"
  const _ = console.log

  try {
    const commands = await _index()
    const pass = commands.length > 0
    _(`[RECHECK PASS] First command: ${JSON.stringify(commands[0], null, 2)}`)
    return pass ? _(`\x1b[42m[PASS]\x1b[0m ${TEST_CASE}`) : _(`\x1b[41m[FAIL]\x1b[0m ${TEST_CASE}`)
  } catch (err) {
    _(err)
    return _(`\x1b[41m[FAIL]\x1b[0m ${TEST_CASE}`)
  } finally {
    await TinyPage.closeBrowser()
    await firebaseMonitor.cleanLog()
  }
})()
