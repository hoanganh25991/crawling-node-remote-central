const request = require("request")

export const getData = url => {
  const options = {
    method: "GET",
    url,
    headers: { "content-type": "application/json" }
  }

  return new Promise(resolve =>
    request(options, function(error, response, body) {
      if (error) throw new Error(error)
      resolve(body)
    })
  )
}

export default getData
