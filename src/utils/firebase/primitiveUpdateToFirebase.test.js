import primitiveUpdateToFirebase, { db, thisApp as firebaseApp } from "./primitiveUpdateToFirebase"
import { combineReducers, createStore } from "redux"
import { logReducers, LogToConsole } from "../../reducers/logReducers"
;(async () => {
  const store = createStore(combineReducers({ logState: logReducers }))
  const getState = () => ({})
  const _updateToFirebase = primitiveUpdateToFirebase(getState, store.dispatch)

  LogToConsole(store)

  const TEST_CASE = `Update to firebase`
  const _ = console.log

  try {
    const mainBranch = "tmp"
    const objXBranch = "primitiveUpdateToFirebase"
    const now = new Date().getTime()
    const msg = [now]

    const key = await _updateToFirebase(mainBranch, objXBranch)(msg)

    const refToObjXBranch = db.ref(`${mainBranch}/${objXBranch}/${key}`)
    const fbVal = await new Promise(resolve => {
      refToObjXBranch.once("value", function(snapshot) {
        resolve(snapshot.val())
      })
    })

    console.log(fbVal)

    // Firebase return snapshot as obj shape:
    /*
    {
      "KWIJHUHJK": {
        title: "xxx",
        content: "xxx"
      }
    }
     */

    // Self clean up
    // await db.ref(`${mainBranch}/${objXBranch}/${key}`).remove()

    const pass = fbVal === now
    return pass ? _(`\x1b[42m[PASS]\x1b[0m ${TEST_CASE}`) : _(`\x1b[41m[FAIL]\x1b[0m ${TEST_CASE}`)
  } catch (err) {
    _(err)
    return _(`\x1b[41m[FAIL]\x1b[0m ${TEST_CASE}`)
  } finally {
    // Clean up
    await firebaseApp.delete()
  }
})()
