const unirest = require("unirest")

export const saveToMongodb = (objX, url) => {
  const req = unirest("POST", url)
  req.headers({ "content-type": "application/json" })
  req.type("json")
  req.send(objX)

  return new Promise((resolve, reject) =>
    req.end(function(res) {
      if (res.error) reject(res.error)
      resolve(res.body)
    })
  )
}

// ;(async () => {
//   const s = await saveToMongodb({title: "xxx"}, "http://vagrant2.dev:3001/api/remotecategories")
//   console.log(s)
// })()

export default saveToMongodb
