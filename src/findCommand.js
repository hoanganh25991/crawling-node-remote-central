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

// {
//   title: `Inject getIdFromSelector for page`,
//   exposeFunction: [
//     "getIdFromSelector",
//     selector => {
//       const idStrs = selector.match(/\d+/gi)
//       if (!idStrs) throw new Error(`Cant find id from selector: ${selector}`)
//       //Get the first one only
//       return Number(idStrs[0])
//     }
//   ]
// },

// {
//   title: `Store available categories`,
//   actions: [
//     {
//       title: `Open filter 'Bộ lọc' for categories 'Phân loại'`,
//       click: `#fdDlgSearchFilter > div.sf-left > ul > li:nth-child(3)`
//     },
//     {
//       title: `Wait for filter 'Bộ lọc' load categories 'Phân loại'`,
//       waitForFunction: `setTimeout(()=>{document.querySelector("#fdDlgSearchFilter > div.sf-left > ul > li:nth-child(3)").getAttribute("class")==="active"}, 500)`
//     },
//     {
//       title: `Evaluate`,
//       evaluate: async () => {
//         const inputNodeList = document.querySelectorAll(
//           "#fdDlgSearchFilter > div.sf-right > div:nth-child(1) > ul > li > input"
//         )
//         const inputList = []
//         for (let i = 0; i < inputNodeList.length; i++) {
//           inputList.push(inputNodeList[i])
//         }
//         const availableCategories = await inputList.reduce(async (carry, inputElement) => {
//           const lastCarry = await carry
//           const selector = `#${inputElement.id}`
//           const labelElement = inputElement.nextElementSibling
//           const displayName = labelElement.innerText
//           //noinspection JSUnresolvedFunction
//           const id = await window.getIdFromSelector(selector)
//           return [...lastCarry, { selector, displayName, id }]
//         }, [])
//         return availableCategories
//       },
//       storeReturnAsKey: "availableCategories"
//     }
//   ]
// }

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
            const groupNodeList = document.querySelectorAll("td div.filelistdevice a")
            const groupList = Array.apply(null, groupNodeList)
            return groupList.map(aNode => aNode.getAttribute("href"))
          },
          storeReturnAsKey: "linkList"
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

const joinTwoList = list1 => list2 => {
  return list1.reduce((carry, item) => {
    const itemWithList2Item = list2.map(list2Item => [item, list2Item])
    return [...carry, ...itemWithList2Item]
  }, [])
}

const storeData = fileName => data => {
  const fs = require("fs")
  fs.writeFileSync(`${jsonLogDir}/${fileName}`, JSON.stringify(data))
}

const findCommand = async () => {
  const browser = await puppeteer.launch(config.launch)
  const page = await browser.newPage()
  await NetworkManager(page)

  const fullUrl = sub => `http://files.remotecentral.com${sub}`

  const first = "/library/3-1/index.html"

  console.log(fullUrl(first))

  // const linkList = await readDescription(page)(findXXX(fullUrl(first)))
  // const linkList = ["/library/3-1/sonos/index.html", "/library/3-1/sony/index.html", "/library/3-1/t%252Ba/index.html"]

  // const s = await readDescription(page)(getCommand(fullUrl("/library/3-1/arcam/index.html")))

  // const data = linkList.map(async url => {
  //   const page = await browser.newPage()
  //   return await readDescription(page)(getCommand(fullUrl(url)))
  // })
  //
  // const xxx = await Promise.all(data)
  //
  // console.log(xxx)

  const linkList = ["/library/3-1/t%252Ba/index.html"]

  // const loop = kickLinkList => async (redoCount, lastResult, finish) => {
  //   logWithInfo(`Running... Redo count: ${redoCount}`)
  //
  //   // First run, using kickLinkList
  //   const linkList = redoCount === 0 ? kickLinkList : lastResult
  //
  //   const pageRun = linkList.map(async url => {
  //     const page = await browser.newPage()
  //     return await readDescription(page)(getCommand(fullUrl(url)))
  //   })
  //
  //   const waitForAllPageFinished = Promise.all(pageRun)
  //   const _newLinkList = await waitForAllPageFinished
  //   // Filter null link
  //   const newLinkList = _newLinkList.map(obj => obj.link).filter(link => link)
  //   const shouldEndLoop = newLinkList.length === 0
  //   if (shouldEndLoop) finish()
  //
  //   logWithInfo(`New link list: ${JSON.stringify(newLinkList, null, 2)}`)
  //
  //   return newLinkList
  // }
  //
  // const s = await redo(loop(linkList))

  let lastCount = 0
  const count = count => {
    lastCount += count
    console.log("\x1b[36m%s\x1b[0m", lastCount)
  }

  const run = async url => {
    const page = await browser.newPage()
    await NetworkManager(page)
    const { linkList: _links } = await readDescription(page)(getLinksDes(url))
    await page.close()
    const links = _links.map(path => fullUrl(path))

    const noDeepLink = links.length === 0

    let nextStep = [url]

    if (!noDeepLink) {
      nextStep = links.slice(0, 10)
      // nextStep = links
    }

    const pagesRun = nextStep.map(async url => {
      const page = await browser.newPage()
      await NetworkManager(page)
      const crawlingResult = await readDescription(page)(getCommandDes(url))
      const flatCommands = crawlingResult["commands"]["commands"]
      count(flatCommands.length)
      // Save
      await updateToFirestore("nodeRemoteCentral")("commands")("title")(flatCommands)
      await page.close()
      return crawlingResult["commands"]["link"]
    })
    const remainLinks = await Promise.all(pagesRun)
    return remainLinks.filter(link => link)
  }

  // const remainLinks = await run("http://files.remotecentral.com/library/3-1/t%252Ba/whole_system/index.html")
  // const remainLinks = await run("http://files.remotecentral.com/library/3-1/apple/index.html")
  // const remainLinks = await run("http://files.remotecentral.com/library/3-1/index.html")
  // console.log(remainLinks)

  const loop = url => async (redoCount, lastResult, finish) => {
    console.log("redocount", redoCount)
    const isArr = Array.isArray(url)
    const passInUrl = isArr ? url : [url]
    const list = redoCount === 0 ? passInUrl : lastResult
    console.log("I see list as", list)

    const shouldBreak = list.length === 0 || redoCount > 10

    if (shouldBreak) {
      finish()
    }

    const remainLinksListNotFlat = await Promise.all(list.map(async pathUrl => await run(fullUrl(pathUrl))))
    return remainLinksListNotFlat.reduce((c, list) => [...c, ...list], [])
  }

  await redo(loop("/library/3-1/index.html"))

  await browser.close()

  // console.log(s)
  process.exit()
}
;(async () => {
  await findCommand()
})()

module.exports = findCommand
