const { logDebug: _ } = require("../log")
const callFoodyApi = require("./callFoodyApi")

/**
 * Get Foody Stores
 * @param urlEndpoint
 * @returns {Array}

 * urlEndpoint ex:
 https://www.foody.vn/ho-chi-minh/an-vat-via-he-tai-quan-2?c=an-vat-via-he&page=1&categorygroup=food&append=true

 * response ex:
  {
    "seoData": {
    "MetaTitle": "Địa điểm Ăn vặt/vỉa hè tại Quận 2, TP. HCM",
    "MetaKeywords": null,
    "MetaDescription": "Danh sách  hơn 51 địa điểm Ăn vặt/vỉa hè tại Quận 2, TP. HCM. Foody.vn là website #1 tại VN về tìm kiếm địa điểm, có hàng ngàn bình luận, hình ảnh"
    },
    "searchItems": [],
    "searchUrl": "/ho-chi-minh/an-vat-via-he-tai-quan-2?c=an-vat-via-he&categorygroup=food",
    "totalResult": 51,
    "totalSubItems": 2
  }
 */
const getFoodyStores = async urlEndpoint => {
  const { searchItems: foodyStores } = await callFoodyApi(urlEndpoint)
  return foodyStores
}

module.exports = getFoodyStores
