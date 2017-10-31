import primitiveUpdateToFirebase from "../utils/firebase/primitiveUpdateToFirebase"

let lastPush = Promise.resolve()

export const firebaseMonitor = (getState, store) => {
  const customDispatch = action => action && action.msg && console.log(action.msg)
  const _primitiveUpdateToFB = primitiveUpdateToFirebase(() => ({}), customDispatch)

  const pushToFirebase = async logMsg => {
    await lastPush
    const mainBranch = "tmp"
    const objXBranch = "logMsgs"
    const objXIndexKey = "msg"
    return _primitiveUpdateToFB(mainBranch, objXBranch, objXIndexKey)([logMsg])
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
  await primitiveUpdateToFirebase.close()
}

firebaseMonitor.push = firebaseMonitor.waitForLastPush

export default firebaseMonitor
