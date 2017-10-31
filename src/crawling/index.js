import crawlingCategories from "./crawlingCategories"
import crawlingCmds from "./crawlingCmds"

/**
 * Compile crawling categories & commands
 * @param getState
 * @param dispatch
 */
const run = (getState, dispatch) => async () => {
  const _crawlingCategories = crawlingCategories(getState, dispatch)
  const _crawlingCmds = crawlingCmds(getState, dispatch)

  const url = "http://files.remotecentral.com/library/3-1/index.html"
  const categories = await _crawlingCategories(url)

  // Support test runner
  const slice = getState().categoriesSlice || categories.length

  const commands = await _crawlingCmds(categories.slice(0, slice))

  return commands
}

export default run
