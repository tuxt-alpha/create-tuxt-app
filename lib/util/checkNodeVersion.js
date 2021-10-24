const semver = require('semver')
const printer = require('../printer')

function checkNodeVersion(required, id) {
  const currentUsed = process.version
  if (!semver.satisfies( /* current node version */ currentUsed, required)) {
    printer.error(
      '  The version of' + id + 'requires Node' + required + ', But the currently used version is ' + currentUsed,
      '  Please upgrade your Node version.'
    )
    process.exit(1)
  }
}

module.exports = checkNodeVersion