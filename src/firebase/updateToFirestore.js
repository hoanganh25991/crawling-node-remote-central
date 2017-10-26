const { logDebug } = require("./../log/index")
const admin = require("firebase-admin")
const serviceAccount = require("./../.credential/firebase-service-account.json")
const thisApp = admin.initializeApp(
  {
    credential: admin.credential.cert(serviceAccount)
  },
  "firestore"
)
const db = thisApp.firestore()

const updateObjX = mainBranch => objXBranch => objXIndexKey => async objX => {
  const lx = logDebug.indent(1)
  // Find if post exist
  const { [objXIndexKey]: id } = objX
  const refToObjXBranch = db.doc(mainBranch).collection(objXBranch)
  const sameObjX = await new Promise(resolve => {
    refToObjXBranch
      .where(objXIndexKey, "==", id)
      .limit(1)
      .get(function(snapshot) {
        const arr = []
        snapshot.forEach(doc => arr.push(doc))
        resolve(arr[0])
      })
  })

  const doc = sameObjX ? sameObjX : refToObjXBranch.doc()
  logDebug(lx)(`Saving store...`)
  await doc.update(objX)
}

const updateManyObjXs = mainBranch => objXBranch => objXIndexKey => objXs => {
  return objXs.reduce(async (carry, objX) => {
    await carry
    return updateObjX(mainBranch)(objXBranch)(objXIndexKey)(objX)
  }, 123)
}

// Add one signal branch
;(async () => {
  // const mainBranch = "tinyPOS"
  // const objXBranch = "orders"
  // const objXIndexKey = "id"
  // const justNotifyMeChannel = {
  //   id: new Date().getTime(),
  //   // id: 1508575793931,
  //   items: [
  //     {
  //       name: "Gà cay phô mai",
  //       price: 1500
  //     },
  //     {
  //       name: "Trà sữa",
  //       price: 18,
  //       toppings: [
  //         {
  //           name: "Trân châu",
  //           price: 4
  //         },
  //         {
  //           name: "Hoàng Hải",
  //           price: 6
  //         }
  //       ]
  //     }
  //   ]
  //
  // }
  // await updateManyObjXs(mainBranch)(objXBranch)(objXIndexKey)([justNotifyMeChannel])
  // db.collection("orders").get().then(snap => snap.forEach(d => console.log(d.data())))
  // db.collection("tinyPOS").doc("title").set({title: "tinyPOS"})
  // await db.collection("xxx").doc().set({})
  // const objectXRef = db.collection("xxx").doc("nodeRemoteCentral").collection("categories").where("title", "==", "xxx").get().then(snap => snap.forEach(d => console.log(d.id)))
  // await db
  //   .collection("xxx")
  //   .doc("apple")
  //   .set({ title: "Apple", count: 7 })
  // await db
  //   .collection("xxx")
  //   .doc("apple")
  //   .collections("subcategories")
  //   .doc()
})()

module.exports = updateManyObjXs
