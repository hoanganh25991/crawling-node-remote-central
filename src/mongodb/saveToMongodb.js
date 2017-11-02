var request = require("request")

var options = {
  method: "POST",
  url: "http://vagrant2.dev:3001/api/remotecategories",
  headers: { "content-type": "application/json" },
  body: {
    title: "Apple",
    count: 7,
    category_id: "59fb3a7907dfd0e723c54a0b"
  },
  json: true
}

request(options, function(error, response, body) {
  if (error) throw new Error(error)

  console.log(body)
})
