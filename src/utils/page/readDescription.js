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
  dispatch({ type: "INCREASE_LOG_LEVEL" })
  const xxx = await pageActions.reduce(async (carry, pageAction) => {
    const lastResult = await carry
    return runPageAction(getState, dispatch)(page, lastResult, pageAction)
  }, Promise.resolve(lastResult))
  dispatch({ type: "DECREASE_LOG_LEVEL" })
  return xxx
}

export const runPageAction = (getState, dispatch) => async (page, lastReturn, pageAction) => {
  const { title, actions: pageActions } = pageAction
  dispatch({ type: "LOG", msg: title })

  // Has child actions, self call to callApiUrl it
  const hasChildActions = Boolean(pageActions)

  if (hasChildActions) {
    return await queuePageActions(getState, dispatch)(page, lastReturn, pageActions)
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
    dispatch({ type: "LOG_ERROR", err })
    return lastReturn
  }
}

const readDescription = (getState, dispatch) => async description => {
  dispatch({ type: "LOG", msg: "Reading description" })
  const page = await TinyPage()
  const pageActions = [...description]
  const storeReturn = await queuePageActions(getState, dispatch)(page, {}, pageActions)
  await page.close()
  dispatch({ type: "LOG", msg: "Crawling done" })
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
