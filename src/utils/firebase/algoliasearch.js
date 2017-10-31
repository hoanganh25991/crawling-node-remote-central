const admin = require("firebase-admin")
const algoliasearch = require("algoliasearch")
const serviceAccount = require("./../.credential/firebase-service-account.json")
const thisApp = admin.initializeApp(
  { credential: admin.credential.cert(serviceAccount), databaseURL: "https://glass-turbine-148103.firebaseio.com/" },
  "algoiasearch"
)
const { appId, appKey } = require("../.credential/algolia.json")

const db = thisApp.database()
const algolia = algoliasearch(appId, appKey)

const index = algolia.initIndex("commands")

index.setSettings(
  {
    searchableAttributes: ["title"]
  },
  function(err, content) {
    console.log(content)
  }
)

const initialImport = (resolve, reject) => dataSnapshot => {
  // Array of data to index
  const objectsToIndex = []
  // Get all objects
  const values = dataSnapshot.val()
  // Process each child Firebase object
  dataSnapshot.forEach(function(childSnapshot) {
    // get the key and data from the snapshot
    const childKey = childSnapshot.key
    const childData = childSnapshot.val()
    // Specify Algolia's objectID using the Firebase object key
    childData.objectID = childKey
    // Add object for indexing
    objectsToIndex.push(childData)
  })
  // Add or update new objects
  index.saveObjects(objectsToIndex, function(err, content) {
    if (err) reject(err)
    resolve(console.log("Firebase -> Algolia import done", content))
  })
}

/**
 * Build index search on firebase collection
 * @returns {Promise.<void>}
 */
const run = async () => {
  const commandsRef = db.ref("nodeRemoteCentral/commands")
  await new Promise((resolve, reject) => {
    commandsRef.once("value", initialImport(resolve, reject))
  })
}

module.exports = run
