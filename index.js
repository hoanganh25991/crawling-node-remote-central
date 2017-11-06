import index from "./src/crawling/indexV2"
import { combineReducers, createStore } from "redux"
import { logReducers, LogToConsole } from "./src/reducers/logReducers"
import TinyPage from "./src/utils/page/TinyPage"
import TrackTime from "./src/utils/trackTime"
import sendNotification from "./src/utils/sendNotification"
const _ = console.log
import axios from "axios"

//////
import saveToMongodb from "./src/mongodb/saveToMongodb"
;(async () => {
  const store = createStore(combineReducers({ logState: logReducers }))
  // const mongoHost = "http://mean.originally.us:3001"
  // const _index = index(() => ({mongoHost}), store.dispatch)
  const mongoHost = "http://vagrant2.dev:3001"
  const _index = index(() => ({ mongoHost, categoriesSlice: 2 }), store.dispatch)
  const t = TrackTime()
  t.start()

  LogToConsole(store)

  const TEST_CASE = "Run Crawling"
  let pass = true

  try {
    await _index()

    // Update crawling info
    // Build crawling obj
    const res = await axios.get(`${mongoHost}/api/crawlinginfo/one`)
    const lastCrawlingInfo = res.data || {}
    const { version = 1, compatibleVersion = 1 } = lastCrawlingInfo

    const crawlingInfo = {
      ...lastCrawlingInfo,
      version: version + 1,
      compatibleVersion,
      finishedAfter: t.diff(),
      timestamp: Math.floor(new Date().getTime() / 1000)
    }

    _(crawlingInfo)

    // Save
    await saveToMongodb(crawlingInfo, `${mongoHost}/api/crawlinginfo/one`)
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
