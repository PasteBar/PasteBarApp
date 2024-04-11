const fs = require('fs')
const pathfn = require('path')
const plugin = require('tailwindcss/plugin')
const generator = require('./generator')
const crypto = require('crypto')

module.exports = plugin.withOptions(({ path = '', patterns = [] }) => ({ theme }) => {
  const safeList = generator(theme)(patterns).join('\n')
  console.log('path', pathfn.resolve(path))

  try {
    const currentSafeList = fs.readFileSync(pathfn.resolve(path)).toString()

    const hash = crypto.createHash('md5').update(JSON.stringify(safeList)).digest('hex')
    const prevHash = crypto
      .createHash('md5')
      .update(JSON.stringify(currentSafeList))
      .digest('hex')

    if (hash !== prevHash) {
      return fs.writeFileSync(path, safeList)
    }
  } catch (e) {
    fs.writeFileSync(path, safeList)
  }
})
