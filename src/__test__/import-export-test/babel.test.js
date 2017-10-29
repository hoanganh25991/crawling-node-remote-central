;(async () => {
  const exec = require("child_process").exec
  const _ = (strings, ...holes) => {
    if (holes.length === 0) {
      console.log(strings)
    } else {
      console.log(...holes)
    }
  }
  const cmd = "babel src --out-dir=dist --presets=/usr/local/share/.config/yarn/global/node_modules/babel-preset-nde7"
  const err = await new Promise(resolve => exec(cmd, resolve))

  if (err) return _`[INFO] Babel build fail`

  const execBuiltFile = "node dist/import-func"
  const err2 = await new Promise(resolve =>
    exec(execBuiltFile, (err, stdout) => {
      const funcRunFail = stdout !== "I CAN SEE LOG"
      resolve(err && funcRunFail)
    })
  )

  if (err2) return _`[INFO] Fail to run built file`

  _`${"\x1b[42m%s\x1b[0m"}${"[PASSED]"}${"Babel build"}`
})()
