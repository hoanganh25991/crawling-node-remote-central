import axios from "axios"

export const saveToMongodb = async (objX, url) => {
  const res = await axios.post(url, objX)
  return res.data
}

export default saveToMongodb
