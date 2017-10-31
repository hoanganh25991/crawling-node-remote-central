/**
 * Redo an callback
 * @param callback
 * @returns {Promise.<*>}
 */
export const redo = async callback => {
  let redoCount = 0
  let lastResult = null
  let shouldRun = true
  const finish = () => (shouldRun = false)
  do {
    lastResult = await callback(redoCount, lastResult, finish)
    redoCount++
  } while (shouldRun)

  return lastResult
}

export default redo
