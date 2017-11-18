import axios from "axios"
const _ = console.log
axios.defaults.headers = { Connection: "keep-alive" }
axios.defaults.timeout = 2000

export const saveToMongodb = async (objX, url) => {
  try {
    const res = await axios.post(url, objX)
    return res.data
  } catch (err) {
    _(`\x1b[41m[FAIL]\x1b[0m To save ${objX.title}`)
    return null
  }
}

export default saveToMongodb
