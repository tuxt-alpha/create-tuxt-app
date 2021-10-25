/**
 * Util function @name download 下载Github资源 Created on 2021/10/24
 * 
 * Last modified on 2021/10/25
 * 
 * Copyright (c) 2021 Ecan Chen <ecanwellchen@gmail.com>
 */
const download = require('download')
const ora = require('ora')

module.exports = downloadTemplate

function downloadTemplate(url, dest, options = {}) {
  const spinner = ora('Downloading template...').start()
  return download(url, dest, options).then(() => spinner.stop())
}