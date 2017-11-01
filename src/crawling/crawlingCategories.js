const chunk = require("lodash.chunk")
// const primitiveUpdateToFirebase = require("../utils/firebase/primitiveUpdateToFirebase")
import _readDescription from "../utils/page/readDescription"

const getLinksDes = (url, level) => {
  return [
    {
      title: `Get links`,
      actions: [
        {
          title: `Go to url: ${url}`,
          goto: url
        },
        {
          title: `Expose level`,
          exposeFunction: ["level", () => level]
        },
        {
          title: `Find categories`,
          evaluate: async () => {
            const currLevel = await window.level()
            const cateDivs = document.querySelectorAll("td div.filelistdevice")
            const cateDivArr = Array.apply(null, cateDivs)

            const buildCateObjFromNodeElm = (aNode, level = 0) => {
              const url = `${window.location.origin}${aNode.querySelector("a").getAttribute("href")}`
              const title = aNode.querySelector("a").innerText
              const count = +aNode.querySelector("span.smalltextc").innerText.match(/\d+/)[0]
              return { url, title, count, level }
            }

            return cateDivArr.map(aNode => {
              const cate = buildCateObjFromNodeElm(aNode, currLevel)

              let sub = []
              let shouldRun = true
              let currElm = aNode
              const nextLevel = currLevel + 1

              do {
                currElm = currElm.nextElementSibling
                const hasClass = currElm && currElm.getAttribute("class")
                shouldRun = hasClass && hasClass.includes("bulletlarge")
                if (shouldRun) {
                  const cate = buildCateObjFromNodeElm(currElm, nextLevel)
                  sub.push(cate)
                }
              } while (shouldRun)

              cate.sub = sub

              return cate
            })
          },
          storeReturnAsKey: "crawledCategories"
        }
      ]
    }
  ]
}

/**
 * Crawling categories
 * @param getState
 * @param describe
 * @constructor
 */
const CrawlingCategories = (getState, describe) => async url => {
  describe({ type: "LOG", msg: `\x1b[36m<<< CRAWLING CATEGORIES >>>\x1b[0m` })

  const readDescription = _readDescription(() => {}, describe)

  const level = 0
  const crawlingResult = await readDescription(getLinksDes(url, level))
  let { crawledCategories: categories } = crawlingResult

  describe({ type: "LOG", msg: `Found ${categories.length} categories in home page` })
  describe({ type: "FIND_X_CATEGORIES", totalCategories: categories.length })

  describe({ type: "LOG", msg: `Go deep into category's url to find sub category` })
  describe({ type: "LOG", msg: `Open ${5} pages at same time` })

  const chunks = chunk(categories, 5)
  const nextLevel = level + 1

  await chunks.reduce(async (carry, chunk) => {
    await carry
    return Promise.all(
      chunk.map(async cate => {
        const crawlingResult = await readDescription(getLinksDes(cate.url, nextLevel))
        const { crawledCategories: subCates } = crawlingResult

        describe({ type: "LOG", msg: `\x1b[36m[${cate.title}] Found ${subCates.length} sub categories\x1b[0m` })
        describe({ type: "FIND_X_CATEGORIES", totalCategories: subCates.length })

        cate.sub = [...cate.sub, ...subCates]
      })
    )
  }, describe({ type: "LOG", msg: `\x1b[36mTotal queue 'Open page': ${chunks.length}\x1b[0m` }))

  // await primitiveUpdateToFirebase("nodeRemoteCentral")("categories")("title")(categories)
  return categories
}

export default CrawlingCategories
