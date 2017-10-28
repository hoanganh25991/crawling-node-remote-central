const logWithInfo = require("./logWithInfo")
const puppeteer = require("puppeteer")
const { puppeteer: config } = require("./config")
const logExactErrMsg = require("./logExactErrMsg")
const { screenshot } = require("./utils/page/pageUtils")
const homepage = "https://www.foody.vn/ho-chi-minh#/places"
const viewport = { width: 1200, height: 600 }
const screenshotDir = "screenshot"
const jsonLogDir = "tmp"
const { redo } = require("./utils")
const updateToFirestore = require("./utils/firebase/updateToFirestore")
const updateToFirebase = require("./utils/firebase/updateToFirebase")

const db = require("./utils/firebase/firestoreDb")

const NetworkManager = async page => {
  await page.setRequestInterceptionEnabled(true)
  const requestList = []
  page.on("console", msg => {
    console.log(msg)
  })
  page.on("request", interceptedRequest => {
    requestList.push(interceptedRequest)
    const staticAssets =
      interceptedRequest.url.endsWith(".jpg") ||
      interceptedRequest.url.endsWith(".png") ||
      interceptedRequest.url.endsWith(".gif")
    if (staticAssets) interceptedRequest.abort()
    else interceptedRequest.continue()
  })

  return {
    log() {
      logWithInfo(`[NetworkManager] Summary: ${requestList.length} requets`)
    },
    get() {
      return requestList
    }
  }
}

const sampleAwaitAction = {
  title: "Sameple await action",
  actions: [],
  // click: ["arg1", "arg2"],
  storeReturnAsKey: "sampleAwaitAction",
  screenshot: true
}

const getReservedKeyInAwaitAction = () => Object.keys(sampleAwaitAction)

const getActionName = awaitAction => {
  const keys = Object.keys(awaitAction)
  const reservedKeys = getReservedKeyInAwaitAction()
  const actionName = keys.filter(key => !reservedKeys.includes(key))[0]
  if (!actionName) throw new Error("Cant find actionName")
  return actionName
}

const queueAwaitList = awaitList => lastReturn => async callback => {
  return await awaitList.reduce(async (carry, awaitAction) => {
    const lastReturn = await carry
    return callback(lastReturn)(awaitAction)
  }, lastReturn)
}

const enhancePage = page => {
  if (page.runFunction) return
  page.runFunction = callback => callback()
}

const runPageAction = (page, subLevel = 0) => lastReturn => async awaitAction => {
  enhancePage(page)
  const { title, actions: awaitList } = awaitAction
  logWithInfo(title, subLevel)

  // Has child actions, self call to callApiUrl it
  const hasChildActions = Boolean(awaitList)
  if (hasChildActions) {
    const currSubLevel = subLevel + 1
    const callback = runPageAction(page, currSubLevel)
    return await queueAwaitList(awaitList)(lastReturn)(callback)
  }

  // Run page action
  const actionName = getActionName(awaitAction)
  const params = awaitAction[actionName]
  const args = Array.isArray(params) ? params : [params]
  // const result = await page[actionName](...args)
  let result
  try {
    result = await page[actionName](...args)
  } catch (err) {
    logExactErrMsg(err)
  }

  // Should take screenshot
  const { screenshot } = awaitAction
  if (screenshot) {
    let imgName = title.replace(/[^a-zA-Z]/g, "")
    if (typeof screenshot === "object" && screenshot.imgName) imgName = screenshot.imgName
    await page.screenshot({ path: `${screenshotDir}/${imgName}.jpg`, qualtity: 10 })
  }

  // Should store return
  let actionReturn = {}
  const { storeReturnAsKey } = awaitAction
  if (storeReturnAsKey) {
    actionReturn = { [storeReturnAsKey]: result }
  }

  // Merge return
  return Object.assign(lastReturn, actionReturn)
}

const readDescription = page => async awaitListDescription => {
  const storeReturn = {}
  await queueAwaitList(awaitListDescription)(storeReturn)(runPageAction(page))
  // logWithInfo(["storeReturn", storeReturn])
  return storeReturn
}

const getLinksDes = (url, level) => {
  return [
    {
      title: `Start`,
      actions: [
        {
          title: `Go to url: ${url}`,
          goto: url
        },
        {
          title: `Expose level`,
          exposeFunction: ["level", () => level]
        },
        {
          title: `Count list`,
          evaluate: async () => {
            const currLevel = await window.level()
            console.log(currLevel)

            const groupNodeList = document.querySelectorAll("td div.filelistdevice")

            const groupList = Array.apply(null, groupNodeList)

            const findCate = aNode => _level => {
              const url = `${window.location.origin}${aNode.querySelector("a").getAttribute("href")}`
              const title = aNode.querySelector("a").innerText
              const count = +aNode.querySelector("span.smalltextc").innerText.match(/\d+/)[0]
              return { url, title, count, level: _level }
            }

            return groupList.map(aNode => {
              const cate = findCate(aNode)(currLevel)
              let sub = []
              let shouldRun = true
              let a = aNode
              const nextLevel = currLevel + 1
              do {
                a = a.nextElementSibling
                shouldRun = Boolean(a && a.getAttribute("class") && a.getAttribute("class").includes("bulletlarge"))
                if (shouldRun) {
                  const cate = findCate(a)(nextLevel)
                  sub.push(cate)
                }
              } while (shouldRun)
              cate.sub = sub
              return cate
            })
          },
          storeReturnAsKey: "categories"
        }
      ]
    }
  ]
}

const getCommandDes = url => {
  return [
    {
      title: `Go to url: ${url}`,
      goto: url
    },
    {
      title: `Find command`,
      evaluate: async () => {
        const divSelector = "td  div.filelistnormal"
        const nodes = document.querySelectorAll(divSelector)
        const list = Array.apply(null, nodes)
        const commandList = list.map(node => {
          const subtitle = node.querySelector("div.filelistsubtitle").innerText
          const _title = node.querySelector("div.filelisttitle").innerText
          const title = `${subtitle} ${_title}`
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
          commands: commandList,
          url
        }
      },
      storeReturnAsKey: "crawledCommands"
    }
  ]
}

const findCates = async (browser, url) => {
  const page = await browser.newPage()
  await NetworkManager(page)
  const { categories } = await readDescription(page)(getLinksDes(url))
  await page.close()
  return categories
}

// const finxCommands = async (browser, url) => {
//   const page = browser.newPage()
//   await NetworkManager(page)
//
//   const loop = url => async (redoCount, lastResult, finish) => {
//     const runUrl = redoCount === 0 ? url : lastResult.url
//     if (!runUrl) {
//       finish()
//     }
//
//     const { commands: nextCommands, url } = await readDescription(page)(getCommandDes(runUrl))
//     const { commands: lasCommands = [] } = lastResult
//     const commands = [...lasCommands, ...nextCommands]
//     return { commands, url }
//   }
//
//   const { commands } = await redo(loop(url))
//   await page.close()
//   return commands
// }

const saveCates = async (rootRef, cates) => {
  // cates.map(async cate => {
  //   await rootRef
  //     .collection("_subCategoriesCollection")
  //     .doc(cate.title)
  //     .set(cate)
  // })
  //
  // const subCategories = cates.reduce((carry, cate) => Object.assign(carry, { [cate.title]: cate.count }), {})
  // await rootRef.doc("subCategories").set(subCategories)
  // await rootRef.set({link: "/asdf"}, {merge: true})
  await rootRef.set({ name: "/aasf" }, { merge: true })
}

const saveCommands = async (rootRef, _commands) => {
  _commands.map(async command => {
    await rootRef
      .collection("_commandsCollection")
      .doc(command.title)
      .set(command)
  })

  const commands = _commands.reduce((carry, command) => Object.assign(carry, { [command.title]: true }), {})
  await rootRef.doc("commands").set(commands)
}

const reRun = async (browser, cates, rootRef) => {
  cates.map(async cate => {
    await run(browser, cate.url, rootRef)
  })
}

const dox = async (browser, cates, commands, rootRef) => {
  if (cates) await saveCates(rootRef, cates)
  if (commands) await saveCommands(rootRef, commands)
  if (cates) await reRun(browser, cates, rootRef)
}

const run = async (browser, url, rootRef) => {
  const cates = await findCates(browser, url)
  await saveCates(rootRef, cates)

  // console.log(cates[3])
  process.exit()

  const commands = await finxCommands(browser, url)
  await dox(browser, cates, commands, rootRef)
  if (cates.sub) {
    const nextRootRef = 0
    await dox(browser, cates.sub, [], nextRootRef)
  }
}

const findCommands = async () => {
  const browser = await puppeteer.launch(config.launch)
  // const url = "http://files.remotecentral.com/library/3-1/index.html"
  const url = "http://files.remotecentral.com/library/3-1/sony/index.html"
  const rootRef = db.collection("nodeRemoteCentral").doc("sony")
  await run(browser, url, rootRef)
}

// const updateToFirebase = require("./firebase/updateToFirebase")

const chunk = require("lodash.chunk")
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

const kiemLinkLuuInterface = async () => {
  // const rootRef = db.collection("nodeRemoteCentral")

  const browser = await puppeteer.launch(config.launch)
  const page = await browser.newPage()
  await NetworkManager(page)
  const url = "http://files.remotecentral.com/library/3-1/index.html"
  const level = 0
  const crawlingResult = await readDescription(page)(getLinksDes(url, level))
  let { categories } = crawlingResult

  // categories = categories.slice(0, 4)

  const chunks = chunk(categories, 5)

  const nextLevel = level + 1

  await chunks.reduce(async (carry, chunk) => {
    await carry
    return Promise.all(
      chunk.map(async cate => {
        const page = await browser.newPage()
        await NetworkManager(page)
        const crawlingResult = await readDescription(page)(getLinksDes(cate.url, nextLevel))
        await page.close()
        const { categories: subCates } = crawlingResult
        console.log("\x1b[36m%s\x1b[0m", `FIND ${subCates.length} SUBCATE OF CATE: ${cate.title}`)
        cate.sub = [...cate.sub, ...subCates]
      })
    )
  }, console.log(`\x1b[36m%s\x1b[0m`, `Total chunks: ${chunks.length}`))

  await updateToFirebase("nodeRemoteCentral")("categories")("title")(categories)

  return categories
}

const firebaseKey = str => str.replace(/[.#$/[\]]/, "")

const kiemCommandsLuuThemPath = async categories => {
  const browser = await puppeteer.launch(config.launch)
  const page = await browser.newPage()
  await NetworkManager(page)

  let lastCount = 0
  const count = count => {
    lastCount += count
    console.log("\x1b[36m%s\x1b[0m", lastCount)
  }

  const finxCommands = async (browser, startUrl) => {
    const page = await browser.newPage()
    await NetworkManager(page)

    const loop = async (redoCount, lastResult, finish) => {
      const firstRun = redoCount === 0

      lastResult = firstRun ? {} : lastResult
      const runUrl = firstRun ? startUrl : lastResult.url

      if (!runUrl) {
        finish()
        return lastResult
      }

      const { crawledCommands } = await readDescription(page)(getCommandDes(runUrl))
      const { commands: nextCommands, url } = crawledCommands
      // console.log("nextCommands", nextCommands)
      const { commands: lasCommands = [] } = lastResult
      const commands = [...lasCommands, ...nextCommands]
      return { commands, url }
    }

    const { commands } = await redo(loop)
    await page.close()
    return commands
  }

  // const commands = await finxCommands(
  //   browser,
  //   "http://files.remotecentral.com/library/3-1/chief_manufacturing/index.html"
  // )
  // console.log(`FIND ${commands.length} COMMANDS`)

  const allPathToCommands = buildUrlWithPath([], categories)
  // console.log(allPathToCommands)
  // process.exit()
  const chunks = chunk(allPathToCommands, 5)

  await chunks.reduce(async (carry, chunk) => {
    await carry
    return Promise.all(
      chunk.map(async commandPath => {
        const lastPath = commandPath[commandPath.length - 1]
        const url = lastPath.url
        // console.log("See url", url)
        const commands = await finxCommands(browser, url)
        // console.log("Finish find command:", commands)
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
;(async () => {
  try {
    const categories = await kiemLinkLuuInterface()
    await kiemCommandsLuuThemPath(categories)
    // const buildSearch = require("./firebase/firebaseSupportSearch")
    // await buildSearch()
  } catch (err) {
    console.log(err)
  } finally {
    process.exit()
  }
})()

module.exports = findCommands
