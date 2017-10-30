import TinyPage from "./TinyPage"
const screenshotDir = "screenshot"
const quality = 10

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

const queuePageActions = async (page, lastResult, pageActions) => {
  return await pageActions.reduce(async (carry, pageAction) => {
    const lastResult = await carry
    return runPageAction(page, lastResult, pageAction)
  }, Promise.resolve(lastResult))
}

const runPageAction = async (page, lastReturn, pageAction) => {
  const { title, actions: pageActions } = pageAction

  // Has child actions, self call to callApiUrl it
  const hasChildActions = Boolean(pageActions)

  if (hasChildActions) return await queuePageActions(page, lastReturn, pageActions)

  // Run page action
  const actionName = getPageActionName(pageAction)
  const params = pageAction[actionName]
  const args = Array.isArray(params) ? params : [params]

  try {
    const result = await page[actionName](...args)

    // Should take screenshot
    const { screenshot } = pageAction

    if (screenshot) {
      const imgName = (screenshot && screenshot.image) || title.replace(/[^a-zA-Z]/g, "")
      await page.screenshot({ path: `${screenshotDir}/${imgName}.jpg`, quality })
    }

    // Should store return
    const { storeReturnAsKey } = pageAction
    const actionReturn = storeReturnAsKey ? { [storeReturnAsKey]: result } : {}

    // Merge return
    return Object.assign(lastReturn, actionReturn)
  } catch (err) {
    return lastReturn
  }
}

const readDescription = async description => {
  const page = await TinyPage()
  const pageActions = [...description]
  const storeReturn = await queuePageActions(page, {}, pageActions)
  await page.close()
  return storeReturn
}

export default readDescription
