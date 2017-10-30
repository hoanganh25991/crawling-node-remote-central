const admin = require("firebase-admin")
const serviceAccount = require("./firebase.config.json")
const thisApp = admin.initializeApp(
  {
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://glass-turbine-148103.firebaseio.com/"
  },
  "firebase"
)
const db = thisApp.database()

const updateObjX = (mainBranch, objXBranch, objXIndexKey = "id") => async objX => {
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
  // logDebug(lx)(`Saving store...`)
  // logDebug(lx)(`ObjX ${objXIndexKey} : ${id}`)
  // logDebug(lx)(`ObjX key: ${objXKey}`)
  await db.ref(`${mainBranch}/${objXBranch}/${objXKey}`).update(objX)
}

const updateManyObjXs = (mainBranch, objXBranch, objXIndexKey) => objXs => {
  return objXs.reduce(async (carry, objX) => {
    await carry
    return updateObjX(mainBranch, objXBranch, objXIndexKey)(objX)
  }, 123)
}

module.exports = updateManyObjXs
