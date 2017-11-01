import iniDynamicApp from "../utils/firebase/iniDynamicApp"
/**
 * Handle log in code
 * @param state
 * @param action
 * @returns {*}
 */
const iniState = {
  totalCategories: null,
  totalCommands: null,
  lastCrawlingTime: null,
  mainBranch: "tmp"
}

export const crawlingInfoReducers = (state = iniState, action) => {
  const { type } = action
  switch (type) {
    case "FIND_X_CATEGORIES": {
      const { totalCategories: addUp } = action
      const { totalCategories: lastTotal } = state
      const totalCategories = lastTotal + addUp
      return { ...state, totalCategories }
    }
    case "FIND_X_COMMANDS": {
      const { totalCommands: addUp } = action
      const { totalCommands: lastTotal } = state
      const totalCommands = lastTotal + addUp
      return { ...state, totalCommands }
    }
    case "CRAWLING_TIME": {
      const { crawlingTime } = action
      return { ...state, lastCrawlingTime: crawlingTime }
    }
    default: {
      return state
    }
  }
}

/**
 * State monitor (only log msg) by
 * Dump into console
 * @param store
 * @constructor
 */
let lastPush = Promise.resolve()
let fbApp = null

export const iniStateMonitor = {
  mainBranch: "tmp",
  objXBranch: "crawlingInfo"
}
export const firebaseCrawlingInfoMonitor = (getState, store) => {
  fbApp = iniDynamicApp()
  const db = fbApp.database()
  const { mainBranch, objXBranch } = iniStateMonitor
  const refToCrawlingInfo = db.ref(`${mainBranch}/${objXBranch}`)

  const pushToFirebase = async crawlingInfo => {
    await lastPush
    return refToCrawlingInfo.update(crawlingInfo)
  }

  store.subscribe(() => {
    const crawlingInfo = getState()
    lastPush = pushToFirebase(crawlingInfo)
  })
}

firebaseCrawlingInfoMonitor.waitForLastPush = async () => {
  await lastPush
}

firebaseCrawlingInfoMonitor.push = firebaseCrawlingInfoMonitor.waitForLastPush

firebaseCrawlingInfoMonitor.cleanLog = async () => {
  await lastPush
  // if (fbApp) {
  //   console.log("[CLEAN LOG] Delete fbApp")
  //   await fbApp.delete()
  // }
  if (fbApp) await fbApp.delete()
}

export default firebaseCrawlingInfoMonitor
