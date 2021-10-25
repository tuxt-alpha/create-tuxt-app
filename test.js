const downloadTemplate = require('./lib/downloadTemplate')

downloadTemplate('https://github.com/tuxt-js/tuxt-app-template/archive/main.zip', '.template', {
  extract: true
}).then(() => {
  console.log('Download completed')
})