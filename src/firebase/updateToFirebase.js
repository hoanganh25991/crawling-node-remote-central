const { logDebug } = require("./../log/index")
const admin = require("firebase-admin")
const serviceAccount = require("./../.credential/glass-turbine.json")
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://glass-turbine-148103.firebaseio.com/"
})
const db = admin.database()

const updateObjX = mainBranch => objXBranch => objXIndexKey => async objX => {
  const lx = logDebug.indent(1)
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
  logDebug(lx)(`Saving store...`)
  logDebug(lx)(`ObjX ${objXIndexKey} : ${id}`)
  logDebug(lx)(`ObjX key: ${objXKey}`)
  await db.ref(`${mainBranch}/${objXBranch}/${objXKey}`).update(objX)
}

const updateManyObjXs = mainBranch => objXBranch => objXIndexKey => objXs => {
  return objXs.reduce(async (carry, objX) => {
    await carry
    return updateObjX(mainBranch)(objXBranch)(objXIndexKey)(objX)
  }, 123)
}

// Remove stores branch
// (async () => {
//   const storesRef = db.ref("nodeFoodyStores/stores")
//   await storesRef.remove()
//   console.log("Done")
//   process.exit()
// })()

// Add one signal branch
// (async () => {
//   const mainBranch = "oneSignal"
//   const objXBranch = "channels"
//   const objXIndexKey = "appId"
//   const justNotifyMeChannel = { appId: "1e28d329-d699-4c8e-a4d4-1a4b91afd0f1", appName: "JustNotifyMe"}
//   await updateObjX(mainBranch)(objXBranch)(objXIndexKey)(justNotifyMeChannel)
//   process.exit()
// })()

module.exports = updateManyObjXs
