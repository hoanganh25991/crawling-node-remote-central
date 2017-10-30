import readDescription from "./readDescription"
;(async () => {
  try {
    const crawlingTitle = [
      {
        title: `Go to google.com`,
        goto: `www.google.com`
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

    if (!pass) return console.log("FAIL")

    return console.log("SUCCESS")
  } catch (err) {
    console.log(err)
  } finally {
    process.exit()
  }
})()
