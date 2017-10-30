import readDescription from "./readDescription"
;(async () => {
  try {
    const crawlingTitle = [
      {
        title: `Go to google.com`,
        goto: `https://www.google.com.vn`
      },
      {
        title: `Get title`,
        evaluate: () => {
          return document.title
        },
        storeReturnAsKey: "pageTitle"
      }
    ]

    const crawlingReturn = await readDescription(crawlingTitle)

    const { pageTitle } = crawlingReturn
    const pass = pageTitle === "Google"

    if (!pass) return console.log(`\x1b[41m[FAIL]\x1b[0m Read description fail!`)

    return console.log(`\x1b[42m[PASS]\x1b[0m Read description`)
  } catch (err) {
    console.log(err)
  } finally {
    process.exit()
  }
})()
