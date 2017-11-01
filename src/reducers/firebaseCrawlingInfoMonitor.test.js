import firebaseMonitor, { iniStateMonitor as monitorState, crawlingInfoReducers } from "./firebaseCrawlingInfoMonitor"
import { combineReducers, createStore } from "redux"
import { logReducers, LogToConsole } from "../reducers/logReducers"
import customFirebase from "../utils/firebase/primitiveUpdateToFirebase"

////
;(async () => {
  const store = createStore(combineReducers({ logState: logReducers, crawlingInfo: crawlingInfoReducers }))
  const describe = store.dispatch

  const getFBState = () => {
    const s = store.getState()
    return { ...s.crawlingInfo }
  }

  firebaseMonitor(getFBState, store)
  LogToConsole(store)

  const TEST_CASE = `Test firebase crawling info monitor`
  const _ = console.log

  try {
    const { mainBranch, objXBranch } = monitorState
    const db = customFirebase.db()
    const refToLog = db.ref(`${mainBranch}/${objXBranch}`)
    await refToLog.remove()

    describe({ type: "FIND_X_CATEGORIES", totalCategories: 5 })
    describe({ type: "FIND_X_CATEGORIES", totalCategories: 5 })
    describe({ type: "FIND_X_COMMANDS", totalCommands: 4 })
    describe({ type: "FIND_X_COMMANDS", totalCommands: 4 })
    describe({ type: "CRAWLING_TIME", crawlingTime: 1000 })

    await firebaseMonitor.push()

    const fbLogMsgs = await new Promise(resolve => refToLog.once("value", snapshot => resolve(snapshot.val())))
    _(`Firebase val: ${JSON.stringify(fbLogMsgs, null, 2)}`)

    const pass = fbLogMsgs.totalCategories === 10
    return pass ? _(`\x1b[42m[PASS]\x1b[0m ${TEST_CASE}`) : _(`\x1b[41m[FAIL]\x1b[0m ${TEST_CASE}`)
  } catch (err) {
    _(err)
    return _(`\x1b[41m[FAIL]\x1b[0m ${TEST_CASE}`)
  } finally {
    await firebaseMonitor.cleanLog()
    await customFirebase.close()
  }
})()
