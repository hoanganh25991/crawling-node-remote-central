;(async () => {
  const exec = require("child_process").exec
  const rimraf = require("rimraf")
  const _ = strTemplate => console.log(strTemplate[0])
  const node7PresetPath = `/usr/local/share/.config/yarn/global/node_modules/babel-preset-node7`
  const cmd = `babel ${__dirname}/src --out-dir=${__dirname}/dist --presets=${node7PresetPath}`
  const err = await new Promise(resolve => exec(cmd, resolve))

  if (err) return _`\x1b[41m[ERR]\x1b[0m Babel build fail`

  const execBuiltFile = `node ${__dirname}/dist/import-func`
  const err2 = await new Promise(resolve =>
    exec(execBuiltFile, (err, stdout) => {
      const funcRunFail = stdout !== "I CAN SEE LOG"
      resolve(err && funcRunFail)
    })
  )

  if (err2) return _`\x1b[41m[ERR]\x1b[0m Exec built file fail`
  await new Promise(resolve => rimraf(`${__dirname}/dist`, resolve))
  _`\x1b[42m[PASS]\x1b[0m babel build`
})()
