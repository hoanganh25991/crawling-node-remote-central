const { logDebug, logErr, logAwait } = require("./log")
const { urlList, redo, sendNotification, hideErrorLog } = require("./utils")
const config = require("./config")
const foodyApi = require("./foody-api")
const updateToFirebase = require("./firebase/updateToFirebase")

const { needStoreKeys, firebaseBranch: { mainBranch, storesBranch, storeIndexKey } } = config
const { getFoodyStores, getOpeningHours, getPhoneNumber, getStoreCreatedDate } = foodyApi

const rebuildStore = async (originStore, needStoreKeys) => {
  const lx = logDebug.indent(1)
  logDebug(lx)(`StoreId: ${originStore.Id}`)

  logDebug(lx)(`Update store key`)
  const store = needStoreKeys.reduce((carry, key) => {
    const myKey = key.charAt(0).toLocaleLowerCase() + key.substring(1)
    carry[myKey] = originStore[key]
    return carry
  }, {})

  const { id: storeId, detailUrl: storeDetailUrl } = store

  logDebug(lx)(`Find 'createdDate'`)
  const createdDate = await getStoreCreatedDate(storeId)
  Object.assign(store, { createdDate })

  logDebug(lx)(`Find 'phoneNumber'`)
  const phoneNumber = await getPhoneNumber(store.id)
  Object.assign(store, { phoneNumber })

  logDebug(lx)(`Find 'openingHours'`) //noinspection JSUnresolvedVariable
  const [openingAt, closedAt] = await getOpeningHours(storeDetailUrl)
  Object.assign(store, { openingAt, closedAt })

  logDebug(lx)(`Update to firebase`)
  await updateToFirebase(mainBranch)(storesBranch)(storeIndexKey)([store])

  return store
}

const crawlingStores = urlEndpoint => async (redoCount, lastResult, finish) => {
  const lx = logDebug.indent(1)
  const pageCount = redoCount + 1
  logDebug(lx)(`Page: ${pageCount}`)
  const urlWithPageQuery = `${urlEndpoint}&page=${pageCount}&append=true`

  logDebug(lx)(`Find stores`)
  const foodyStores = await getFoodyStores(urlWithPageQuery)
  logDebug(lx)(`Found ${foodyStores.length} stores`)

  const shouldBreak = foodyStores.length === 0
  if (shouldBreak) {
    finish()
    return lastResult
  }

  const storesWithNeedInfo = await foodyStores.reduce(async (carry, originStore) => {
    const lastStoreList = await carry
    logDebug(lx)(`Rebuild store`)
    const store = await rebuildStore(originStore, needStoreKeys)
    return [...lastStoreList, store]
  }, [])

  lastResult = lastResult ? lastResult : []
  return [...lastResult, ...storesWithNeedInfo]
}

const crawlingStoresFromApiUrl = lastTotal => async urlEndpoint => {
  const lx = logDebug.indent(1)
  logDebug(lx)(`Crawling stores at MAIN url: ${urlEndpoint}`)
  const stores = await redo(crawlingStores(urlEndpoint))
  const nextSummaryTotal = lastTotal + stores.length
  return nextSummaryTotal
}

const findStores = async () => {
  const lx = logDebug.indent(1)
  logDebug(lx)(`Find stores`) //noinspection JSUnresolvedFunction

  const totalStoreFound = await urlList.reduce(async (carry, urlEndpoint) => {
    const lastTotal = await carry
    logDebug(lx)(`crawlingStoresFromApiUrl`)
    return crawlingStoresFromApiUrl(lastTotal)(urlEndpoint)
  }, 0)

  logDebug(lx)(`Summary: Find ${totalStoreFound} stores`)
}

// Run module
;(async () => {
  try {
    hideErrorLog()
    await findStores()
  } catch (err) {
    logErr(err)
  } finally {
    logDebug("==============COMPLETE CRAWLING FOODY==============")
    await sendNotification("Complete", { headings: { en: "Crawling Foody" } })
    process.exit()
  }
})()

module.exports = findStores
