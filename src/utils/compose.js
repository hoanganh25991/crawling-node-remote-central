/**
 * Compose func can use with async
 * @param funcs
 * @returns {Promise.<*>}
 */
export default async (...funcs) => {
  if (funcs.length === 0) {
    return arg => arg
  }

  if (funcs.length === 1) {
    return funcs[0]
  }

  return funcs.reduce((a, b) => async (...args) => await a(await b(...args)))
}
