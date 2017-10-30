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

export const reservedKeysInPageAction = () => Object.keys(samplePageAction)

export const getPageActionName = pageAction => {
  const keys = Object.keys(pageAction)
  const reservedKeys = reservedKeysInPageAction()
  // Pop the first action
  const pageActionName = keys.filter(key => !reservedKeys.includes(key))[0]
  if (!pageActionName) throw new Error("Cant find actionName")
  return pageActionName
}

export const queuePageActions = (model, dispatch) => async (page, lastResult, pageActions) => {
  return await pageActions.reduce(async (carry, pageAction) => {
    const lastResult = await carry
    return runPageAction(model, dispatch)(page, lastResult, pageAction)
  }, Promise.resolve(lastResult))
}

export const runPageAction = (model, dispatch) => async (page, lastReturn, pageAction) => {
  dispatch({ type: "LOG", pageAction })
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
    dispatch({ type: "LOG_ERROR", err })
    return lastReturn
  }
}

const readDescription = (model, dispatch) => async description => {
  dispatch({ type: "LOG", description })
  const page = await TinyPage()
  const pageActions = [...description]
  const storeReturn = await queuePageActions(model, dispatch)(page, {}, pageActions)
  await page.close()
  dispatch({ type: "LOG", storeReturn })
  return storeReturn
}

export default readDescription

export const iniState = {}
export const reducers = (state = iniState, action) => {
  const { type, ...others } = action
  switch (type) {
    case "LOG": {
      return Object.assign({}, state, { log: others })
    }
    case "LOG_ERROR": {
      return Object.assign({}, state, { logErr: others })
    }
    default: {
      return state
    }
  }
}
