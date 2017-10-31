/**
 * Simple track timer
 * @param option
 * @returns {*}
 * @constructor
 */
export const TrackTime = (option = {}) => {
  const titleL = option.title || `${new Date().getTime()}`
  const time = { start: null, end: null }

  return {
    start() {
      Object.assign(time, { start: new Date().getTime() })
    },
    end() {
      Object.assign(time, { end: new Date().getTime() })
      const seconds = Math.floor((time.end - time.start) / 1000).toFixed(2)
      console.log(`Done in ${seconds}s`)
    },
    time() {
      return time
    },
    diff() {
      const now = new Date().getTime()
      return now - time.start
    }
  }
}

export default TrackTime
