import crawlingCmds from "./crawlingCmds"
import { combineReducers, createStore } from "redux"
import { logReducers, LogToConsole } from "../reducers/logReducers"
import TinyPage from "../utils/page/TinyPage"
;(async () => {
  const store = createStore(combineReducers({ logState: logReducers }))
  const _crawlingCmds = crawlingCmds(() => {}, store.dispatch)
  LogToConsole(store)

  const TEST_CASE = `Crawling commands`
  const _ = console.log

  try {
    const categories = [
      {
        title: "Apple",
        count: 7,
        sub: [],
        url: "http://files.remotecentral.com/library/3-1/apple/index.html"
      },
      {
        title: "Arcam",
        count: 4,
        sub: [
          {
            title: "DVD Players",
            count: 2,
            sub: [],
            url: "http://files.remotecentral.com/library/3-1/arcam/dvd_player/index.html"
          },
          {
            title: "Receivers",
            count: 2,
            sub: [],
            url: "http://files.remotecentral.com/library/3-1/arcam/receiver/index.html"
          }
        ],
        url: "http://files.remotecentral.com/library/3-1/arcam/index.html"
      }
    ]
    const commandWithPaths = await _crawlingCmds(categories)
    const pass = commandWithPaths.length > 0
    return pass ? _(`\x1b[42m[PASS]\x1b[0m ${TEST_CASE}`) : _(`\x1b[41m[FAIL]\x1b[0m ${TEST_CASE}`)
  } catch (err) {
    _(err)
    return _(`\x1b[41m[FAIL]\x1b[0m ${TEST_CASE}`)
  } finally {
    await TinyPage.closeBrowser()
  }
})()
