const request = require("request")

const convertToObj = str => JSON.parse(str)

export const getData = url => {
  const options = {
    method: "GET",
    url,
    headers: { "content-type": "application/json" }
  }

  return new Promise(resolve =>
    request(options, function(error, response, body) {
      if (error) throw new Error(error)
      resolve(convertToObj(body))
    })
  )
}

export const deleteData = url => {
  const options = {
    method: "DELETE",
    url,
    headers: { "content-type": "application/json" }
  }

  return new Promise(resolve =>
    request(options, function(error, response, body) {
      if (error) throw new Error(error)
      resolve(convertToObj(body))
    })
  )
}

export default getData
