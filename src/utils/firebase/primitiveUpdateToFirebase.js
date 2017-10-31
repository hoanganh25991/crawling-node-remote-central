const admin = require("firebase-admin")
const { serviceAccount, databaseURL } = require("./firebase.config.json")
export const thisApp = admin.initializeApp(
  {
    credential: admin.credential.cert(serviceAccount),
    databaseURL
  },
  "primitiveUpdateToFirebase"
)
export const db = thisApp.database()

const updateObjX = (getState, describe) => (mainBranch, objXBranch) => async primitive => {
  // Find if post exist
  const refToObjXBranch = db.ref(`${mainBranch}/${objXBranch}`)
  const key = refToObjXBranch.push().key
  describe({ type: "LOG", msg: `Saving store...` })
  describe({ type: "LOG", msg: `ObjX key: ${key}` })
  await db.ref(`${mainBranch}/${objXBranch}/${key}`).set(primitive)
  return key
}

const updateManyObjXs = (getState, describe) => (mainBranch, objXBranch) => primitives => {
  return primitives.reduce(async (carry, primitive) => {
    await carry
    return updateObjX(getState, describe)(mainBranch, objXBranch)(primitive)
  }, Promise.resolve())
}

export default updateManyObjXs
