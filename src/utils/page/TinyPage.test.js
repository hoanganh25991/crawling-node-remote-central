;(async () => {
  try {
    const TinyPage = require("./TinyPage")
    const page = await TinyPage()
    await page.goto("https://www.google.com.vn")
    const title = await page.title()
    await page.close()
    await TinyPage.closeBrowser()
    const pass = title === "Google"

    if (!pass) return console.log(`\x1b[41m[ERR]\x1b[0m Create tiny page fail`)

    return console.log(`\x1b[42m[PASS]\x1b[0m Create tiny page`)
  } catch (err) {
    console.log(err)
  } finally {
    process.exit()
  }
})()
