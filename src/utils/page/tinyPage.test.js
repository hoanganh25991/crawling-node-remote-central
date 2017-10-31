import TinyPage from "./TinyPage"
;(async () => {
  const TEST_CASE = "Create tinyPage"
  const _ = console.log

  try {
    const page = await TinyPage()
    await page.goto("https://www.google.com.vn")
    const title = await page.title()
    await page.close()
    const pass = title === "Google"

    return pass ? _(`\x1b[42m[PASS]\x1b[0m ${TEST_CASE}`) : _(`\x1b[41m[FAIL]\x1b[0m ${TEST_CASE}`)
  } catch (err) {
    _(err)
    return _(`\x1b[41m[FAIL]\x1b[0m ${TEST_CASE}`)
  } finally {
    await TinyPage.closeBrowser()
  }
})()
