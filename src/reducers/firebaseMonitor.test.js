import firebaseMonitor, { iniState as monitorState } from "./firebaseMonitor"
import { combineReducers, createStore } from "redux"
import { logReducers, LogToConsole } from "../reducers/logReducers"
import customFirebase from "../utils/firebase/primitiveUpdateToFirebase"

////
;(async () => {
  const store = createStore(combineReducers({ logState: logReducers }))
  const describe = store.dispatch

  firebaseMonitor(s => s.logState, store)
  LogToConsole(store)

  const TEST_CASE = `Test firebase monitor`
  const _ = console.log

  try {
    const { mainBranch, objXBranch } = monitorState
    const db = customFirebase.db()
    const refToLog = db.ref(`${mainBranch}/${objXBranch}`)
    await refToLog.remove()

    const msgNow = `This is test log at ${new Date().getTime()}`
    describe({ type: "LOG", msg: msgNow })
    await firebaseMonitor.waitForLastPush()
    // await new Promise(resolve => setTimeout(async () => {
    //   await firebaseMonitor.waitForLastPush()
    //   resolve()
    // }, 2000))

    const fbLogMsgs = await new Promise(resolve => refToLog.once("value", snapshot => resolve(snapshot.val())))
    _(`Firebase val: ${JSON.stringify(fbLogMsgs, null, 2)}`)

    const pass = Object.values(fbLogMsgs)[0] === ` ${msgNow}`
    return pass ? _(`\x1b[42m[PASS]\x1b[0m ${TEST_CASE}`) : _(`\x1b[41m[FAIL]\x1b[0m ${TEST_CASE}`)
  } catch (err) {
    _(err)
    return _(`\x1b[41m[FAIL]\x1b[0m ${TEST_CASE}`)
  } finally {
    await firebaseMonitor.cleanLog()
  }
})()
