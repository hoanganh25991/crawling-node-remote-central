import crawlingCategories from "./crawlingCategories"
import { findCommands } from "./crawlingCmds"
import { saveToMongodb } from "../mongodb/saveToMongodb"
import chunk from "lodash.chunk"

const _ = console.log

const runAndSave = (getState, describe) => (parentCateId, categories) => {
  const mongoCateUrl = "http://vagrant2.dev:3001/api/remotecategories"
  const mongoComUrl = "http://vagrant2.dev:3001/api/remotecommands"
  const _findCommands = findCommands(getState, describe)

  describe({ type: "LOG", msg: `Open ${2} pages at same time to crawl` })

  const chunks = chunk(categories, 2)

  let countFail = 0

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
        if (!savedCate) return
        const hasSub = cate.sub && cate.sub.length > 0

        if (hasSub) return await runAndSave(getState, describe)(savedCate._id, cate.sub)

        const commands = await _findCommands(cate.url.trim())
        const commandWithCateIds = commands.map(command => ({ ...command, category_id: savedCate._id }))

        let allSaved = true
        const wait = commandWithCateIds.reduce(async (carry, objX) => {
          const successSaved = Boolean(await carry)
          countFail = countFail + (successSaved ? 0 : 1)
          allSaved = allSaved && successSaved
          return saveToMongodb(objX, mongoComUrl)
        }, describe({ type: "LOG", msg: `Saving ${commandWithCateIds.length} commands` }))

        wait.then(() => {
          // describe({type: "LOG", msg: `[${cate.title}] ${allSaved} saved`})
          cate.successSaved = allSaved
        })
        return await wait
      })
    )
  }, describe({ type: "LOG", msg: `\x1b[36mTotal queue 'Open page': ${chunks.length}\x1b[0m` }))

  return wait.then(() => countFail)
}

const successSaved = cates => {
  let saved = true

  const run = cates => {
    const shouldBreak = !cates || cates.length === 0

    if (shouldBreak) {
      return
    }

    cates.map(cate => {
      saved = saved && cate.successSaved
      run(cate.sub)
    })
  }

  run(cates)
  return saved
}

// const retry = 10
// const redo = (getState, dispatch) => async cates => {
//   let hasFail = false
//   let count = 0
//   do {
//     try {
//       hasFail = !successSaved(cates)
//       _("hasFail", hasFail)
//       await runAndSave(getState, dispatch)(null, cates)
//     } catch (err) {
//       _(err)
//     } finally {
//       count++
//     }
//   } while (hasFail && count < retry)
//
//   _(hasFail ? "Still has fail" : "Ok fine")
//   return !hasFail
// }

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
