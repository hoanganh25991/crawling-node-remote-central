const { redo } = require("../utils/redo")
const chunk = require("lodash.chunk")
const updateToFirebase = require("../utils/firebase/updateToFirebase")
import readDescription from "../utils/page/readDescription"

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

const buildCategoryWithSubList = async url => {
  const level = 0
  const crawlingResult = await readDescription(getLinksDes(url, level))
  let { crawledCategories: categories } = crawlingResult

  const chunks = chunk(categories, 5)
  const nextLevel = level + 1

  await chunks.reduce(async (carry, chunk) => {
    await carry
    return Promise.all(
      chunk.map(async cate => {
        const crawlingResult = await readDescription(getLinksDes(cate.url, nextLevel))
        const { crawledCategories: subCates } = crawlingResult
        console.log(`\x1b[36m${subCates[0]}\x1b[0m`)
        cate.sub = [...cate.sub, ...subCates]
      })
    )
  }, console.log(`\x1b[36m%s\x1b[0m`, `Total chunks: ${chunks.length}`))

  // await updateToFirebase("nodeRemoteCentral")("categories")("title")(categories)
  return categories
}

export default buildCategoryWithSubList
