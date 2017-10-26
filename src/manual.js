const { availableLocations, availableCategories } = require("./location-category.json")
const updateManyObjXs = require("./firebase/updateToFirebase")

const run = async () => {
  const mainBranch = "nodeFoodyStores"
  const locationBranch = "locations"
  const categoryBranch = "categories"
  await updateManyObjXs(mainBranch)(locationBranch)("id")(availableLocations)
  await updateManyObjXs(mainBranch)(categoryBranch)("id")(availableCategories)
  process.exit()
}

run()
