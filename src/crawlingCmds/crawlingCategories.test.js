import buildCategoryWithSubList from "./crawlingCategories"

;(async () => {
  const url = "http://files.remotecentral.com/library/3-1/index.html"
  const categories = await buildCategoryWithSubList(url)
  console.log(categories.length)
})()
