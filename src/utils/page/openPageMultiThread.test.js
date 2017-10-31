import TrackTime from "../trackTime"
import TinyPage from "./TinyPage"

const t = TrackTime()
const timeOut = 6 * 1000
///
;(async () => {
  t.start()
  const TEST_CASE = "Create tinyPage"
  const _ = console.log

  const now = new Date().getTime()
  console.time(`${TEST_CASE}${now}`)

  try {
    // await TinyPage.initBrowser()

    const arr5 = [1, 1, 1]
    await Promise.all(
      arr5.map(async () => {
        _(`Open page`)
        const page = await TinyPage()
        await page.goto("https://www.google.com.vn")
        await page.title()
        await page.close()
      })
    )

    await TinyPage.closeBrowser()

    process.on("exit", () => {
      t.end()
      // When process can exit (no thing hangs it ou)
      // Consider as PASS
      const pass = true
      return pass ? _(`\x1b[42m[PASS]\x1b[0m ${TEST_CASE}`) : _(`\x1b[41m[FAIL]\x1b[0m ${TEST_CASE}`)
    })
  } catch (err) {
    _(err)
    return _(`\x1b[41m[FAIL]\x1b[0m ${TEST_CASE}`)
  } finally {
    // OLALA, so cool here when setTimeout can self kill when process exit normally
    // When process not hang >>> alow process exit normal
    // When process hang >>> set a timeout to exit it
    // BUT when setTimeout means PUSH A STACK on current process
    // t.unref (see below code) let timer go out of process stack
    // self close when which one come first
    const t = setTimeout(function() {
      process.removeAllListeners("exit")
      _(`\x1b[41m[FAIL]\x1b[0m ${TEST_CASE}`)
      process.exit(1)
    }, timeOut)
    // allow process to exist naturally before the timer if it is ready to
    t.unref()
  }
})()
