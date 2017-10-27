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
    searchableAttributes: [
      "title"
      // 'firstname',
      // 'company',
      // 'email',
      // 'city',
      // 'address'
    ]
  },
  function(err, content) {
    console.log("Set index settings, allow search on title")
    console.log(content)

    console.log("Should run process exit. Stop by async/await")
    // process.exit(0);
  }
)

const initialImport = async dataSnapshot => {
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
  await index.saveObjects(objectsToIndex, async (err, content) => {
    if (err) {
      throw err
    }

    console.log("Firebase -> Algolia import done")
  })
}

const run = async () => {
  const commandsRef = db.ref("nodeRemoteCentral/commands")
  await commandsRef.once("value", initialImport)
}

module.exports = run
