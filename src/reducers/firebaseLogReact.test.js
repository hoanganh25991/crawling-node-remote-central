import index from "../crawling/index"
// import index from "../crawling/indexV2"
import { combineReducers, createStore } from "redux"
import { logReducers, LogToConsole } from "../reducers/logReducers"
import TinyPage from "../utils/page/TinyPage"
import firebaseMonitor from "./firebaseMonitor"
import firebaseCrawlingInfoMonitor, { crawlingInfoReducers } from "./firebaseCrawlingInfoMonitor"
import TrackTime from "../utils/trackTime"

/////
;(async () => {
  const store = createStore(combineReducers({ logState: logReducers, crawlingInfo: crawlingInfoReducers }))
  const describe = store.dispatch
  const _index = index(() => ({ categoriesSlice: 2 }), describe)

  const getFbCIState = () => {
    const s = store.getState()
    return { ...s.crawlingInfo }
  }

  const getFbState = () => {
    const s = store.getState()
    return { ...s.logState, silentConsoleLog: true }
  }

  describe({ type: "@INIT_STATE" })

  firebaseCrawlingInfoMonitor(getFbCIState, store)
  firebaseMonitor(getFbState, store)
  LogToConsole(store)

  const t = TrackTime()

  t.start()
  const TEST_CASE = "Crawling"
  const _ = console.log

  try {
    const commands = await _index()

    describe({ type: "CRAWLING_TIME", crawlingTime: t.diff() })

    const pass = commands.length > 0
    _(`[RECHECK PASS] Total command: ${commands.length}`)
    _(`[RECHECK PASS] First one: ${JSON.stringify(commands[0], null, 2)}`)
    return pass ? _(`\x1b[42m[PASS]\x1b[0m ${TEST_CASE}`) : _(`\x1b[41m[FAIL]\x1b[0m ${TEST_CASE}`)
  } catch (err) {
    _(err)
    return _(`\x1b[41m[FAIL]\x1b[0m ${TEST_CASE}`)
  } finally {
    await TinyPage.closeBrowser()
    await firebaseMonitor.cleanLog()
    await firebaseCrawlingInfoMonitor.cleanLog()
  }
})()
