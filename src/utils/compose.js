export default async (...funcs) => {
  if (funcs.length === 0) {
    return arg => arg
  }

  if (funcs.length === 1) {
    return funcs[0]
  }

  return funcs.reduce(async (a, b) => async (...args) => await a(await b(...args)))
}
