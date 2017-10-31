const admin = require("firebase-admin")
const serviceAccount = require("./firebase.config.json")
// const defaultUrl = "https://glass-turbine-148103.firebaseio.com/"
const defautAppName = "updateToFirebase"

// lastIni shape
// Find out should we ini new app to run update
/*
{
  databaseURL: "xxx",
  appName: "xxx",
}
 */

const lastIni = {}

const iniFirebaseApp = (getState, dispatch) => {
  const lastIniEmpty = Object.keys(lastIni).length === 0

  const { databaseURL, appName } = getState()
  const { databaseURL: lastDBUrl, appName: lastAppName } = lastIni

  const urlChanged = databaseURL && databaseURL !== lastDBUrl
  const appNameChanged = appName && appName !== lastAppName

  const shouldIniNewApp = lastIniEmpty || urlChanged || appNameChanged

  if (!shouldIniNewApp) return lastIni

  const dbUrl = urlChanged ? databaseURL : lastDBUrl

  if (!dbUrl) throw new Error("Please specify databaseURL to run updateToFirebase")

  const aName = appNameChanged ? appName : lastAppName || defautAppName

  const fbApp = admin.initializeApp({ credential: admin.credential.cert(serviceAccount), dbUrl }, aName)
  const db = fbApp.database()

  Object.assign(lastIni, { databaseURL: dbUrl, appName: aName, fbApp, db })

  return { fbApp, db }
}

const updateObjX = (getState, describe) => (db, mainBranch, objXBranch, objXIndexKey = "id") => async objX => {
  // Find if post exist
  const { [objXIndexKey]: id } = objX
  const refToObjXBranch = db.ref(`${mainBranch}/${objXBranch}`)
  const sameObjX = await new Promise(resolve => {
    refToObjXBranch
      .orderByChild(objXIndexKey)
      .equalTo(id)
      .limitToFirst(1)
      .once("value", function(snapshot) {
        resolve(snapshot.val())
      })
  })

  const objXKey = sameObjX ? Object.keys(sameObjX)[0] : refToObjXBranch.push().key
  describe({ type: "LOG", msg: `Saving store...` })
  describe({ type: "LOG", msg: `ObjX ${objXIndexKey} : ${id}` })
  describe({ type: "LOG", msg: `ObjX key: ${objXKey}` })
  await db.ref(`${mainBranch}/${objXBranch}/${objXKey}`).update(objX)
}

const xxx = () => (mainBranch, objXBranch, objXIndexKey) => objXs => {
  return objXs.reduce(async (carry, objX) => {
    await carry
    return updateObjX(getState, describe)(db, mainBranch, objXBranch, objXIndexKey)(objX)
  }, Promise.resolve())
}

const updateManyObjXs = (getState, describe) => {
  const callback = xxx()
  const { fbApp, db } = iniFirebaseApp(getState, describe)
  callback.getState = getState
  callback.dispatch = describe
  callback.fbApp = fbApp
  callback.db = db
  return callback
}

export default updateManyObjXs
