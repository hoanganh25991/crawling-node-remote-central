import crawlingCategories from "./crawlingCategories"
import { findCommands } from "./crawlingCmds"
import { saveToMongodb } from "../mongodb/saveToMongodb"
import chunk from "lodash.chunk"

const _ = console.log

const runAndSave = (getState, describe) => (parentCateId, categories) => {
  const { mongoHost = "http://vagrant2.dev:3001" } = getState()
  const msg = mongoHost
    ? `\x1b[42m[PASS]\x1b[0m See mongoHost: ${mongoHost}`
    : `\x1b[41m[INFO]\x1b[0m No mongoHost setup, fallback to default: ${mongoHost}`

  describe({ type: "LOG", msg })

  const mongoCateUrl = `${mongoHost}/api/remotecategories`
  const mongoComUrl = `${mongoHost}/api/remotecommands`
  const _findCommands = findCommands(getState, describe)
  describe({ type: "LOG", msg: `Open ${2} pages at same time to crawl` })

  const chunks = chunk(categories, 2)

  const wait = chunks.reduce(async (carry, categories) => {
    await carry
    return Promise.all(
      categories.map(async cate => {
        if (cate.successSaved) {
          describe({ type: "LOG", msg: `[${cate.title}] already saved` })
          return
        }
        // Save cate
        cate.category_id = parentCateId
        const savedCate = await saveToMongodb(cate, mongoCateUrl)

        if (!savedCate) {
          describe({ type: "LOG", msg: `\x1b[41m[WARN]\x1b[0m Ignore save commands of ${cate.title}` })
          return
        }

        const hasSub = cate.sub && cate.sub.length > 0
        if (hasSub) return await runAndSave(getState, describe)(savedCate._id, cate.sub)

        const commands = await _findCommands(cate.url.trim())
        const commandWithCateIds = commands.map(command => ({ ...command, category_id: savedCate._id }))

        const wait = commandWithCateIds.reduce(async (carry, objX) => {
          await carry
          return saveToMongodb(objX, mongoComUrl)
        }, describe({ type: "LOG", msg: `Saving ${commandWithCateIds.length} commands` }))

        return await wait
      })
    )
  }, describe({ type: "LOG", msg: `\x1b[36mTotal queue 'Open page': ${chunks.length}\x1b[0m` }))

  return wait
}

/**
 * Compile crawling categories & commands
 * @param getState
 * @param dispatch
 */
const run = (getState, dispatch) => async () => {
  const _crawlingCategories = crawlingCategories(getState, dispatch)
  const url = "http://files.remotecentral.com/library/3-1/index.html"

  // Support test runner
  const categories = await _crawlingCategories(url)
  const slice = getState().categoriesSlice || categories.length
  return await runAndSave(getState, dispatch)(null, categories.slice(0, slice))
  // return successSaved(categories.slice(0, slice))
}

export default run
