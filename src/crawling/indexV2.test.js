import index from "./indexV2"
import { combineReducers, createStore } from "redux"
import { logReducers, LogToConsole } from "../reducers/logReducers"
import TinyPage from "../utils/page/TinyPage"
import TrackTime from "../utils/trackTime"
import sendNotification from "../utils/sendNotification"

//////
;(async () => {
  const store = createStore(combineReducers({ logState: logReducers }))
  // const _index = index(() => ({categoriesSlice: 2}), store.dispatch)
  const _index = index(() => ({}), store.dispatch)
  const t = TrackTime()
  t.start()

  LogToConsole(store)

  const TEST_CASE = "Crawling V2"
  const _ = console.log
  let pass = true

  try {
    pass = await _index()
  } catch (err) {
    _(err)
    pass = false
  } finally {
    const msg = pass ? `\x1b[42m[PASS]\x1b[0m ${TEST_CASE}` : `\x1b[41m[FAIL]\x1b[0m ${TEST_CASE}`
    await TinyPage.closeBrowser()
    await sendNotification(msg)
    t.end()
    _(msg)
  }
})()
