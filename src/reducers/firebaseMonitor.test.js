import firebaseMonitor from "./firebaseMonitor"
import { combineReducers, createStore } from "redux"
import { logReducers, LogToConsole } from "../reducers/logReducers"
////
;(async () => {
  const store = createStore(combineReducers({ logState: logReducers }))
  const describe = store.dispatch

  firebaseMonitor(s => s.logState, store)
  LogToConsole(store)

  const TEST_CASE = `Test firebase monitor`
  const _ = console.log

  try {
    describe({ type: "LOG", msg: `This is test log` })
    describe({ type: "LOG", msg: `This is test log` })
    describe({ type: "LOG", msg: `This is test log` })
    await firebaseMonitor.waitForLastPush()

    const pass = true
    return pass ? _(`\x1b[42m[PASS]\x1b[0m ${TEST_CASE}`) : _(`\x1b[41m[FAIL]\x1b[0m ${TEST_CASE}`)
  } catch (err) {
    _(err)
    return _(`\x1b[41m[FAIL]\x1b[0m ${TEST_CASE}`)
  } finally {
  }
})()
