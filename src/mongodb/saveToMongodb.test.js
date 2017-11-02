import save from "./saveToMongodb"
import getData, { deleteData } from "./getData"
///
;(async () => {
  const TEST_CASE = "Save to mongo"
  const _ = console.log

  try {
    const url = "http://vagrant2.dev:3001/api/remotecategories"
    const title = `${new Date().getTime()}`
    const objX = { title }
    const savedObjX = await save(objX, url)

    const data = await getData(`${url}/${savedObjX._id}`)
    await deleteData(`${url}/${savedObjX._id}`)

    const pass = Boolean(data)
    return pass ? _(`\x1b[42m[PASS]\x1b[0m ${TEST_CASE}`) : _(`\x1b[41m[FAIL]\x1b[0m ${TEST_CASE}`)
  } catch (err) {
    _(err)
    return _(`\x1b[41m[FAIL]\x1b[0m ${TEST_CASE}`)
  } finally {
    // Clean up
  }
})()
