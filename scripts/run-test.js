const fs = require("fs")
const exec = require("child_process").exec
const sLog = require("single-line-log").stdout

const LogQueue = () => {
  let lastPromise = Promise.resolve()

  return {
    asyncLog: str => {
      lastPromise = lastPromise.then(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            sLog(str)
            resolve()
          }, 100)
        })
      })
    },
    watchLog: lastPromise
  }
}

const { asyncLog: myQueue, watchLog } = LogQueue()

const _ = (strTemplate, ...holes) => myQueue(strTemplate[0] + holes.join(" "))

const runTest = async path => {
  _`Scan: ${path}`
  const exist = fs.existsSync(path)

  if (!exist) return _`[ERR] Please provide exist path`

  const isDir = fs.lstatSync(path).isDirectory()
  const isTestFile = path.endsWith(".test.js")

  if (!isDir && !isTestFile) return

  if (!isDir && isTestFile) {
    const testFile = path
    _`Run test file ${testFile}`
    const cmd = `node ${testFile}`
    await new Promise(resolve => exec(cmd, resolve))
    return
  }

  const listInPath = fs.readdirSync(path)

  await Promise.all(
    listInPath.map(async file => {
      const currPath = `${path}/${file}`
      await runTest(currPath)
    })
  )
}

;(async () => {
  const args = process.argv.slice(2)
  const path = args[0]
  await runTest(path)
  _`All test runned`
  await watchLog
})()
