const puppeteer = require("puppeteer")
const devices = require("puppeteer/DeviceDescriptors")
const iPhone = devices["iPhone 6"]

const launchConfig = {
  timeout: 30000,
  args: ["--no-sandbox", "--disable-setuid-sandbox"]
}

const screenshotDir = "screenshot"

/**
 * Emulate mobile device
 */
// puppeteer
//   .launch({
//     timeout: 30000,
//     args: ["--no-sandbox", "--disable-setuid-sandbox"]
//   })
//   .then(async browser => {
//     const page = await browser.newPage()
//     await page.emulate(iPhone)
//     await page.goto("https://www.google.com")
//     // other actions...
//     const dir = "screenshot"
//     await page.screenshot({ path: `${dir}/emulate-iphone.jpeg`, quality: 50 })
//     await browser.close()
//   })

/**
 * Expost outside world function INTO evaluate context
 */
// const crypto = require("crypto")
//
// puppeteer.launch(launchConfig).then(async browser => {
//   const page = await browser.newPage()
//   page.on("console", console.log)
//   await page.exposeFunction("md5", text =>
//     crypto
//       .createHash("md5")
//       .update(text)
//       .digest("hex")
//   )
//   await page.evaluate(async () => {
//     // use window.md5 to compute hashes
//     const myString = "PUPPETEER"
//     const myHash = await window.md5(myString)
//     console.log(`md5 of ${myString} is ${myHash}`)
//   })
//   await browser.close()
// })

// Another example with fs
// const fs = require("fs")
//
// puppeteer.launch(launchConfig).then(async browser => {
//   const page = await browser.newPage()
//   page.on("console", console.log)
//   await page.exposeFunction("readfile", async filePath => {
//     return new Promise((resolve, reject) => {
//       fs.readFile(filePath, "utf8", (err, text) => {
//         if (err) reject(err)
//         else resolve(text)
//       })
//     })
//   })
//   await page.evaluate(async () => {
//     // use window.readfile to read contents of a file
//     const content = await window.readfile("./package.json")
//     console.log(content)
//   })
//   await browser.close()
// })

const pageWithAlotImages =
  "https://www.foody.vn/ho-chi-minh/an-vat-via-he-tai-quan-2?c=an-vat-via-he&page=5&categorygroup=food"

// puppeteer.launch(launchConfig).then(async browser => {
//   console.time("Launch without load image")
//   const page = await browser.newPage();
//   await page.setRequestInterceptionEnabled(true);
//   page.on('request', interceptedRequest => {
//     if (interceptedRequest.url.endsWith('.png') || interceptedRequest.url.endsWith('.jpg') || interceptedRequest.url.endsWith('.jpeg'))
//       interceptedRequest.abort();
//     else
//       interceptedRequest.continue();
//   });
//   await page.goto(pageWithAlotImages);
//   await page.screenshot({path: `${screenshotDir}/page-without-images.jpeg`})
//   await browser.close();
//   console.timeEnd("Launch without load image")
// });

puppeteer.launch(launchConfig).then(async browser => {
  console.time("Launch load image")
  const page = await browser.newPage()
  await page.goto(pageWithAlotImages)
  await page.screenshot({ path: `${screenshotDir}/page-without-images.jpeg` })
  await browser.close()
  console.timeEnd("Launch load image")
})
