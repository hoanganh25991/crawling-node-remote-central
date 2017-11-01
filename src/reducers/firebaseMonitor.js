import primitiveUpdateToFirebase from "../utils/firebase/primitiveUpdateToFirebase"

let lastPush = Promise.resolve()

export const iniState = {
  mainBranch: "tmp",
  objXBranch: "logMsgs"
}

/**
 * State monitor by
 * Push state into firebase
 * @param getState
 * @param store
 */
export const firebaseMonitor = (getState, store) => {
  const { silentConsoleLog } = getState()
  const consoleLog = action => action && action.msg && console.log(action.msg)
  const customDispatch = silentConsoleLog ? () => null : consoleLog
  const _primitiveUpdateToFB = primitiveUpdateToFirebase(() => ({}), customDispatch)

  const pushToFirebase = async logMsg => {
    await lastPush
    const { mainBranch, objXBranch } = iniState
    return _primitiveUpdateToFB(mainBranch, objXBranch)([logMsg])
  }

  let lastLogState = null
  store.subscribe(() => {
    const logState = getState(store.getState())
    const shouldLog = !lastLogState || lastLogState.msg !== logState.msg

    if (shouldLog) {
      lastLogState = logState
      const msg = (logState && logState.msg) || ""
      const level = (logState && logState.level) || 0
      const paddingLength = level * 2 + 1
      const padding = paddingLength >= 0 ? new Array(paddingLength).join(" ") : ""
      const paddingWithRootSlash = level > 0 ? `${padding}\\__` : padding
      lastPush = pushToFirebase(`${paddingWithRootSlash} ${msg}`)
    }
  })
}

firebaseMonitor.waitForLastPush = async () => {
  await lastPush
}

firebaseMonitor.push = firebaseMonitor.waitForLastPush

firebaseMonitor.cleanLog = async () => {
  await lastPush
  const db = primitiveUpdateToFirebase.db()
  const { mainBranch, objXBranch } = iniState
  const refToLog = db.ref(`${mainBranch}/${objXBranch}`)
  await refToLog.remove()
  await primitiveUpdateToFirebase.close()
}

export default firebaseMonitor
