import crawlingCategories from "./crawlingCategories"
import { findCommands } from "./crawlingCmds"
import { saveToMongodb } from "../mongodb/saveToMongodb"
import chunk from "lodash.chunk"

const _ = console.log

const runAndSave = (getState, describe) => (parentCateId, categories) => {
  const mongoCateUrl = "http://vagrant2.dev:3001/api/remotecategories"
  const mongoComUrl = "http://vagrant2.dev:3001/api/remotecommands"
  const _findCommands = findCommands(getState, describe)

  describe({ type: "LOG", msg: `Open ${5} pages at same time to crawl` })

  const chunks = chunk(categories, 2)

  return chunks.reduce(async (carry, categories) => {
    await carry
    return Promise.all(
      categories.map(async cate => {
        // Save cate
        cate.category_id = parentCateId
        const savedCate = await saveToMongodb(cate, mongoCateUrl)
        const hasSub = cate.sub && cate.sub.length > 0

        if (hasSub) return await runAndSave(getState, describe)(savedCate._id, cate.sub)

        // Find and save commands
        const commands = await _findCommands(cate.url)
        const commandWithCateIds = commands.map(command => ({ ...command, category_id: savedCate._id }))
        return await commandWithCateIds.reduce(async (carry, objX, index) => {
          try {
            await carry
          } catch (err) {
            const pending = 20
            console.log(`Retry save, pending... ${pending}s`)
            await new Promise(resolve => setTimeout(resolve, pending * 1000))
            const lastObjX = commandWithCateIds[index - 1]
            await saveToMongodb(lastObjX, mongoComUrl)
          }
          return saveToMongodb(objX, mongoComUrl)
        }, describe({ type: "LOG", msg: `Saving ${commandWithCateIds.length} commands` }))
      })
    )
  }, describe({ type: "LOG", msg: `\x1b[36mTotal queue 'Open page': ${chunks.length}\x1b[0m` }))
}

/**
 * Compile crawling categories & commands
 * @param getState
 * @param dispatch
 */
const run = (getState, dispatch) => async () => {
  const _crawlingCategories = crawlingCategories(getState, dispatch)

  const url = "http://files.remotecentral.com/library/3-1/index.html"
  const categories = await _crawlingCategories(url)

  // Support test runner
  const slice = getState().categoriesSlice || categories.length

  await runAndSave(getState, dispatch)(null, categories.slice(0, slice))

  return "Done"
}

export default run
