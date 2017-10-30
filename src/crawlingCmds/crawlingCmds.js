const { redo } = require("../utils/redo")
const chunk = require("lodash.chunk")
const updateToFirebase = require("../utils/firebase/updateToFirebase")
import readDescription from "../utils/page/readDescription"

const getCommandsDes = url => {
  return [
    {
      title: `Go to url: ${url}`,
      goto: url
    },
    {
      title: `Find commands`,
      evaluate: async () => {
        const cmdDivs = document.querySelectorAll("td  div.filelistnormal")
        const cmdDivArr = Array.apply(null, cmdDivs)

        const commands = cmdDivArr.map(node => {
          const subtitle = node.querySelector("div.filelistsubtitle").innerText
          const rawTitle = node.querySelector("div.filelisttitle").innerText

          const title = `${subtitle} ${rawTitle}`
          const command = node.querySelector("div.filehexcodes").innerText
          const notes = node.querySelector("table > tbody > tr > td:nth-child(1)").innerText

          return {
            title,
            command,
            notes
          }
        })

        const hasNextPage = document.querySelector("div.forumnextlast.fright a")
        const url = hasNextPage ? `${window.location.origin}${hasNextPage.getAttribute("href")}` : null

        return {
          commands: commands,
          url
        }
      },
      storeReturnAsKey: "crawledCommands"
    }
  ]
}

/**
 * Code kiem link luon het cai interface
 * @returns {Promise.<void>}
 */

/**
 * Xu ly vu command co path
 */

const buildUrlWithPath = (path, cates) => {
  let store = []

  const go = store => path => cates => {
    const shouldBreak = !cates || cates.length === 0

    if (shouldBreak) {
      return
    }

    cates.map(cate => {
      const nextPath = [...path, cate]
      // console.log("Push nextPath", nextPath)

      if (!cate.sub || cate.sub.length === 0) {
        store.push(nextPath)
      }

      go(store)(nextPath)(cate.sub)
    })
  }

  go(store)(path)(cates)

  return store
}

const firebaseKey = str => str.replace(/[.#$/[\]]/, "")

const finxCommands = async startUrl => {
  const loop = async (redoCount, lastResult, finish) => {
    const firstRun = redoCount === 0

    lastResult = firstRun ? {} : lastResult
    const runUrl = firstRun ? startUrl : lastResult.url

    if (!runUrl) {
      finish()
      return lastResult
    }

    const { crawledCommands } = await readDescription(getCommandsDes(runUrl))
    const { commands: nextCommands, url } = crawledCommands
    const { commands: lasCommands = [] } = lastResult
    const commands = [...lasCommands, ...nextCommands]
    return { commands, url }
  }

  const { commands } = await redo(loop)
  return commands
}

const kiemCommandsLuuThemPath = async categories => {
  const allPathToCommands = buildUrlWithPath([], categories)

  const chunks = chunk(allPathToCommands, 5)

  await chunks.reduce(async (carry, chunk) => {
    await carry
    return Promise.all(
      chunk.map(async commandPath => {
        const lastPath = commandPath[commandPath.length - 1]
        const url = lastPath.url
        const commands = await finxCommands(url)

        const flatPath = commandPath.reduce((carry, cate, index) => {
          const key = firebaseKey(cate.title)
          return Object.assign(carry, { [key]: index })
        }, {})

        const commandWithPaths = commands.map(command => Object.assign({}, command, { path: flatPath }))
        console.log("\x1b[36m%s\x1b[0m", `Saving ${commandWithPaths.length} commands to firebase`)
        console.log(`First one: `, commandWithPaths[0])
        await updateToFirebase("nodeRemoteCentral")("commands")("title")(commandWithPaths)
      })
    )
  }, console.log("\x1b[36m%s\x1b[0m", `Total chunks: ${chunks.length}`))
}

const crawlingCmds = async () => {
  const categories = await buildCategoryWithSubList()
  await kiemCommandsLuuThemPath(categories)
  // const buildSearch = require("./firebase/firebaseSupportSearch")
  // await buildSearch()
}
;(async () => {
  try {
    await crawlingCmds()
  } catch (err) {
    console.log(err)
  } finally {
    process.exit()
  }
})()

module.exports = crawlingCmds
