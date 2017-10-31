import updateToFirebase from "../utils/firebase/updateToFirebase"

const firebaseMonitor = (getState, dispatch) => {}

const temp = (getState, store) => {
  const _updateToFirebase = updateToFirebase(() => ({}), store.dispatch)

  let lastPush = Promise.resolve()
  const pushToFirebase = async logMsg => {
    await lastPush
    const mainBranch = "tmp"
    const objXBranch = "logMsgs"
    const objXIndexKey = "msg"
    lastPush = _updateToFirebase(mainBranch, objXBranch, objXIndexKey)([logMsg])
  }

  let lastLogState = null
  store.subscribe(() => {
    const { logState } = getState(store.getState())
    const shouldLog = !lastLogState || lastLogState.msg !== logState.msg

    if (shouldLog) {
      lastLogState = logState
      const msg = (logState && logState.msg) || ""
      const level = (logState && logState.level) || 0
      const paddingLength = level * 2 + 1
      const padding = paddingLength >= 0 ? new Array(paddingLength).join(" ") : ""
      const paddingWithRootSlash = level > 0 ? `${padding}\\__` : padding
      pushToFirebase(`${paddingWithRootSlash} ${msg}`)
    }
  })
}
