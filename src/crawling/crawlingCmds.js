import redo from "../utils/redo"
import chunk from "lodash.chunk"
// const primitiveUpdateToFirebase = require("../utils/firebase/primitiveUpdateToFirebase")
import readDescription from "../utils/page/readDescription"
import TinyPage from "../utils/page/TinyPage"

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

const urlWithPath = (path, cates) => {
  let storeReturn = []

  const run = (storeReturn, path, cates) => {
    const shouldBreak = !cates || cates.length === 0

    if (shouldBreak) {
      return
    }

    cates.map(cate => {
      const nextPath = [...path, cate]

      // Only consider to push path, when cate doesnt have sub
      // Bcs structure of page duplicate info in parent's commands & child's commands
      // console.log("Push nextPath", nextPath)
      if (!cate.sub || cate.sub.length === 0) {
        storeReturn.push(nextPath)
      }

      run(storeReturn, nextPath, cate.sub)
    })
  }

  run(storeReturn, path, cates)

  return storeReturn
}

const findCommands = (getState, describe) => async startUrl => {
  // describe({type: "LOG", msg: `Find commands at url: ${startUrl}`})

  const loop = async (redoCount, lastResult, finish) => {
    const firstRun = redoCount === 0
    lastResult = firstRun ? {} : lastResult
    const runUrl = firstRun ? startUrl : lastResult.url

    if (!runUrl) {
      finish()
      return lastResult
    }

    if (!firstRun) {
      describe({ type: "LOG", msg: `Find commands on 'next-page': ${runUrl}`, level: 1 })
    }

    const { crawledCommands } = await readDescription(getState, describe)(getCommandsDes(runUrl))
    const { commands: nextCommands, url } = crawledCommands
    const { commands: lasCommands = [] } = lastResult
    const commands = [...lasCommands, ...nextCommands]
    return { commands, url }
  }

  const { commands } = await redo(loop)
  return commands
}

const firebaseKey = str => str.replace(/[.#$/[\]]/, "")

const CrawlingCommadsWithPath = (getState, describe) => async categories => {
  describe({ type: "LOG", msg: `\x1b[36m<<< CRAWLING COMMANDS >>>\x1b[0m` })
  describe({ type: "LOG", msg: `Build url with path from categories input` })
  // Share single browser
  await TinyPage.initBrowser()
  // When category go deep into sub category, need store this path
  // Then commands can reuse this path to tell where they belongs to
  // Ex: commands obj
  /*
  {
    title: "Apple Remote -",
    command: "0009 9998 ...",
    notes: "",
    path: {
      "Apple": 0,
      "Remote": 1 //Path to cate
    }
  }
   */
  const urlToCommandsList = urlWithPath([], categories)

  describe({ type: "LOG", msg: `Open ${5} pages at same time to crawl` })

  const chunks = chunk(urlToCommandsList, 5)
  let storeCommands = []

  await chunks.reduce(async (carry, chunk) => {
    await carry
    return Promise.all(
      chunk.map(async commandPath => {
        const lastPath = commandPath[commandPath.length - 1]
        const { url } = lastPath
        const commands = await findCommands(getState, describe)(url)

        const flatPath = commandPath.reduce((carry, cate, index) => {
          const key = firebaseKey(cate.title)
          return { ...carry, [key]: index }
        }, {})

        const commandWithPaths = commands.map(command => ({ ...command, path: flatPath }))
        storeCommands = [...storeCommands, ...commandWithPaths]

        describe({ type: "LOG", msg: `\x1b[36mFound ${commandWithPaths.length} commands\x1b[0m` })
        describe({ type: "LOG", msg: `First one: ${JSON.stringify(commands[0], null, 2)}` })
        // await primitiveUpdateToFirebase("nodeRemoteCentral")("commands")("title")(commandWithPaths)
      })
    )
  }, describe({ type: "LOG", msg: `\x1b[36mTotal queue 'Open page': ${chunks.length}\x1b[0m` }))

  return storeCommands
}

export default CrawlingCommadsWithPath
