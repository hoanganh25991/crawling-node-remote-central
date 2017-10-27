const logWithInfo = require("./logWithInfo")
const puppeteer = require("puppeteer")
const { puppeteer: config } = require("./config")
const logExactErrMsg = require("./logExactErrMsg")
const { screenshot } = require("./pageUtils")
const homepage = "https://www.foody.vn/ho-chi-minh#/places"
const viewport = { width: 1200, height: 600 }
const screenshotDir = "screenshot"
const jsonLogDir = "tmp"
const { redo } = require("./utils")
const updateToFirestore = require("./firebase/updateToFirestore")
const updateToFirebase = require("./firebase/updateToFirebase")

const db = require("./firebase/firestoreDb")

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

const getLinksDes = url => {
  return [
    {
      title: `Start`,
      actions: [
        {
          title: `Go to url: ${url}`,
          goto: url
        },
        {
          title: `Count list`,
          evaluate: async () => {
            const groupNodeList = document.querySelectorAll("td div.filelistdevice")
            const groupList = Array.apply(null, groupNodeList)

            const findCate = aNode => {
              const link = aNode.querySelector("a").getAttribute("href")
              const title = aNode.querySelector("a").innerText
              const count = aNode.querySelector("span.smalltextc").innerText.match(/\d+/)[0]
              return { link, title, count }
            }

            return groupList.map(aNode => {
              const cate = findCate(aNode)
              let sub = []
              let shouldRun = true
              let a = aNode
              do {
                a = a.nextElementSibling
                shouldRun = Boolean(a && a.getAttribute("class") && a.getAttribute("class").includes("bulletlarge"))
                if (shouldRun) {
                  const cate = findCate(a)
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

        const emptyCommandList = commandList.length === 0

        if (emptyCommandList) {
          return {
            commands: commandList,
            link: window.location.pathname
          }
        }

        const hasNextPage = document.querySelector("div.forumnextlast.fright a")
        if (hasNextPage) {
          return {
            commands: commandList,
            link: hasNextPage.getAttribute("href")
          }
        }

        return {
          commands: commandList,
          link: null
        }
      },
      storeReturnAsKey: "commands"
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

const fincCommands = async (browser, url) => {
  const page = browser.newPage()
  await NetworkManager(page)

  const loop = url => async (redoCount, lastResult, finish) => {
    const runUrl = redoCount === 0 ? url : lastResult.url
    if (!runUrl) {
      finish()
    }

    const { commands: nextCommands, url } = await readDescription(page)(getCommandDes(runUrl))
    const { commands: lasCommands = [] } = lastResult
    const commands = [...lasCommands, ...nextCommands]
    return { commands, url }
  }

  const { commands } = await redo(loop(url))
  await page.close()
  return commands
}

const saveCates = async (rootRef, cates) => {
  cates.map(async cate => {
    await rootRef
      .collection("_subCategoriesCollection")
      .doc(cate.title)
      .set(cate)
  })

  const subCategories = cates.reduce((carry, cate) => Object.assign(carry, { [cate.title]: cate.count }), {})
  await rootRef.doc("subCategories").set(subCategories)
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
  console.log(cates[3])
  process.exit()
  const commands = await findCommands(browser, url)
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
  const rootRef = db.collection("nodeRemoteCentral")
  await run(browser, url, rootRef)
}

;(async () => {
  await findCommands()
})()

module.exports = findCommands
