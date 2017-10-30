import buildCategoryWithSubList from "./crawlingCategories"
import TinyPage from "../utils/page/TinyPage"
;(async () => {
  try {
    const url = "http://files.remotecentral.com/library/3-1/index.html"
    const categories = await buildCategoryWithSubList(url)
    await TinyPage.closeBrowser()
  } catch (err) {
    console.log(err)
  } finally {
    process.exit()
  }
})()
