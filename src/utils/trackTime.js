export const TrackTime = (option = {}) => {
  const titleL = option.title || `${new Date().getTime()}`
  const time = { start: null, end: null }

  return {
    start() {
      Object.assign(time, { start: new Date().getTime() })
    },
    end() {
      Object.assign(time, { end: new Date().getTime() })
      console.log(`${titleL}: ${time.end - time.start}ms`)
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
