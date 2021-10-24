const chalk = require('chalk')

const printError = (...args) => console.error(chalk.red(args.join('\n')))
const printInfo = (...args) => console.log(chalk.cyan(args.join('\n')))

module.exports = {
  error: printError,
  info: printInfo,
}