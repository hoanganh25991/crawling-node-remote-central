const admin = require("firebase-admin")
const serviceAccount = require("./../.credential/firebase-service-account.json")
const thisApp = admin.initializeApp({ credential: admin.credential.cert(serviceAccount) }, "xxxx")
const db = thisApp.firestore()
module.exports = db
