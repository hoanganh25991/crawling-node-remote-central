import TinyPage from "./TinyPage"
const screenshotDir = "./screenshot"
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

export const reservedKeysInPageAction = () => Object.keys(samplePageAction)

export const getPageActionName = pageAction => {
  const keys = Object.keys(pageAction)
  const reservedKeys = reservedKeysInPageAction()
  // Pop the first action
  const pageActionName = keys.filter(key => !reservedKeys.includes(key))[0]
  if (!pageActionName) throw new Error("Cant find actionName")
  return pageActionName
}

export const queuePageActions = (getState, dispatch) => async (page, lastResult, pageActions) => {
  return await pageActions.reduce(async (carry, pageAction) => {
    const lastResult = await carry
    return runPageAction(getState, dispatch)(page, lastResult, pageAction)
  }, Promise.resolve(lastResult))
}

export const runPageAction = (getState, describe) => async (page, lastReturn, pageAction) => {
  const { level } = getState()
  const { title, actions: pageActions } = pageAction

  describe({ type: "LOG", msg: title, level })

  // Has child actions, self call to callApiUrl it
  const hasChildActions = Boolean(pageActions)

  if (hasChildActions) {
    return await queuePageActions(() => ({ level: 1 }), describe)(page, lastReturn, pageActions)
  }

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
    describe({ type: "LOG_ERROR", err })
    return lastReturn
  }
}

const readDescription = (getState, describe) => async description => {
  describe({ type: "LOG", msg: "Reading description" })

  const page = await TinyPage()
  const pageActions = [...description]
  const storeReturn = await queuePageActions(() => ({ level: 0 }), describe)(page, {}, pageActions)
  await page.close()

  describe({ type: "LOG", msg: "Crawling done" })

  return storeReturn
}

export default readDescription

/**
 * Reducers
 */
export const iniState = {}
export const reducers = (state = iniState, action) => {
  const { type, ...others } = action
  switch (type) {
    case "LOG": {
      return Object.assign({}, state, others)
    }
    case "LOG_ERROR": {
      return Object.assign({}, state, others)
    }
    default: {
      return state
    }
  }
}
