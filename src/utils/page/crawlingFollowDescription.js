const samplePageAction = {
  title: "Sameple await action",
  actions: [],
  storeReturnAsKey: "samplePageAction",
  screenshot: true
  // click: "<selector>",
  // goto: "<page url>",
  // ...: page function,
}

const reservedKeysInPageAction = () => Object.keys(samplePageAction)

const getPageActionName = pageAction => {
  const keys = Object.keys(pageAction)
  const reservedKeys = reservedKeysInPageAction()
  // Pop the first action
  const pageActionName = keys.filter(key => !reservedKeys.includes(key))[0]
  if (!pageActionName) throw new Error("Cant find actionName")
  return pageActionName
}

const queuePageActionList = list => lastReturn => async callback => {
  return await list.reduce(async (carry, pageAction) => {
    const lastReturn = await carry
    return callback(lastReturn)(pageAction)
  }, lastReturn)
}

const pageRunFunction = page => {
  if (page.runFunction) return
  page.runFunction = callback => callback()
}

const runPageAction = page => lastReturn => async pageAction => {
  pageRunFunction(page)
  const { title, actions: pageActionList } = pageAction

  // Has child actions, self call to callApiUrl it
  const hasChildActions = Boolean(pageActionList)
  if (hasChildActions) {
    const callback = runPageAction(page)
    return await queuePageActionList(pageActionList)(lastReturn)(callback)
  }

  // Run page action
  const actionName = getPageActionName(pageAction)
  const params = pageAction[actionName]
  const args = Array.isArray(params) ? params : [params]
  // const result = await page[actionName](...args)
  try {
    const result = await page[actionName](...args)

    // Should take screenshot
    const { screenshot } = pageAction
    if (screenshot) {
      let imgName = title.replace(/[^a-zA-Z]/g, "")
      if (typeof screenshot === "object" && screenshot.imgName) imgName = screenshot.imgName
      await page.screenshot({ path: `${screenshotDir}/${imgName}.jpg`, qualtity: 10 })
    }

    // Should store return
    let actionReturn = {}
    const { storeReturnAsKey } = pageAction
    if (storeReturnAsKey) {
      actionReturn = { [storeReturnAsKey]: result }
    }

    // Merge return
    return Object.assign(lastReturn, actionReturn)
  } catch (err) {
    return lastReturn
  }
}

const readDescription = page => async description => {
  const storeReturn = {}
  await queuePageActionList(description)(storeReturn)(runPageAction(page))
  // logWithInfo(["storeReturn", storeReturn])
  return storeReturn
}

const TinyPage = require("./TinyPage")

const _queuePageActions = browser => description => {
  const pageActions = [...description]
  const page = TinyPage(browser)
  pageActions.reduce(async (carry, pageAction) => {
    const lastResult = await carry
    runPageAction(lastResult, pageAction)
  }, Promise.resolve())
}
