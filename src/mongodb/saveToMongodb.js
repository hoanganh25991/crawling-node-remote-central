const request = require("request")

const iniOption = {
  method: "POST",
  headers: { "content-type": "application/json" },
  json: true
}

export const save = (objX, url) => {
  const options = { ...iniOption, url, body: objX }
  return new Promise(resolve =>
    request(options, function(e, res, body) {
      if (e) throw new Error(e)
      resolve(body)
    })
  )
}

export default save
