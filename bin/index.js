#!/usr/bin/env node

const packageJson = require('../package.json')

// Check node version before start
require('../lib/util/checkNodeVersion')(packageJson.engines.node, 'create-tuxt-app')

const program = require('commander')

// Basic set
program
  .name('create-tuxt-app')
  .version('create-tuxt-app v' + packageJson.version, '-v, --version')
  .usage('<project-name>')

// Global command: create project
program
  .arguments('[project-name]')
  // .description('Please provide a project name')
  .action((name) => require('../lib/action/create')(name))

// program run
program.parse(process.argv)