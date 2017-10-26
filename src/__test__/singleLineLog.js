var log = require("single-line-log").stdout
const fs = require("fs")
// or pass any stream:
// var log = require('single-line-log')(process.stdout);
const filePath = `${__dirname}/../../tmp/crawling-foody-stores_2017-10-04_232536.wmv`
var read = 0
var size = fs.statSync(filePath).size
var rs = fs.createReadStream(filePath)
rs.on("data", function(data) {
  read += data.length
  var percentage = Math.floor(100 * read / size)

  // Keep writing to the same two lines in the console
  log("Writing to super large file\n[" + percentage + "%]", read, "bytes read")
})

rs.on("end", () => {
  console.log("")
  console.log("asdfasdF")
})
