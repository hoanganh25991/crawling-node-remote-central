// const request = require("request")
//
// const iniOption = {
//   method: "POST",
//   headers: { "content-type": "application/json" },
//   json: true
// }
//
// export const saveToMongodb = (objX, url) => {
//   const options = { ...iniOption, url, body: objX }
//   return new Promise((resolve, reject) =>
//     request(options, function(e, res, body) {
//       if (e) reject(e)
//       resolve(body)
//     })
//   )
// }
//
// export default saveToMongodb

const http = require("http")

const getLocation = href => {
  const match = href.match(/^(https?\:)\/\/(([^:\/?#]*)(?:\:([0-9]+))?)([\/]{0,1}[^?#]*)(\?[^#]*|)(#.*|)$/)
  return (
    match && {
      href: href,
      protocol: match[1],
      host: match[2],
      hostname: match[3],
      port: match[4],
      pathname: match[5],
      search: match[6],
      hash: match[7]
    }
  )
}

export const saveToMongodb = (objX, url) => {
  const u = getLocation(url)

  const options = {
    method: "POST",
    hostname: u.hostname,
    port: u.port,
    path: u.path,
    headers: {
      "content-type": "application/json"
    }
  }

  return new Promise(resolve => {
    const req = http.request(options, function(res) {
      const chunks = []

      res.on("data", function(chunk) {
        chunks.push(chunk)
      })

      res.on("end", function() {
        const body = Buffer.concat(chunks)
        resolve(JSON.stringify(body.toString()))
      })
    })
    req.write(JSON.stringify(objX))
    req.end()
  })
}

export default saveToMongodb
