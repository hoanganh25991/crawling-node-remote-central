export const iniDynamicApp = () => {
  const appName = `${new Date().getTime()}`
  const admin = require("firebase-admin")
  const { serviceAccount, databaseURL } = require("./firebase.config.json")
  return admin.initializeApp(
    {
      credential: admin.credential.cert(serviceAccount),
      databaseURL
    },
    appName
  )
}

export default iniDynamicApp
