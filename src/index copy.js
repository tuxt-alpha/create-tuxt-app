const execSync = require('child_process').execSync
const fs = require('fs-extra')
const path = require('path')
const commander = require('commander')
const inquirer = require('inquirer')
const ora = require('ora')
const pify = require('pify')
const rimraf = require('rimraf')
const spawn = require('cross-spawn')
const tlog = require('tuxt-log')
// const ttengine = require('tuxt-tengine')
// const MemoryFileSystem = require('memory-fs')
// const mfs = new MemoryFileSystem()
const packageJson = require('../package.json')
const NAME = packageJson.name
const VERSION = packageJson.version

const __cwd = path.resolve(__dirname, '..')
const __template = path.join(__cwd, 'src', 'template')
const __temp = path.resolve(__cwd, '.temp') // Temporary operation directory

let projectName, npmInstall, dependencies = []

const program = new commander.Command(NAME)
  .version(VERSION)
  .arguments('[project-name]')
  .action((name) => doMain(name))
  .parse(process.argv)

function doMain(name) {
  // Not find project name
  if (!name) {
    tlog.error('Not find project name, Such as `npx create-tuxt-app my-tuxt-app`')
    process.exit(1)
  }

  // Project name already exists
  if (fs.existsSync(name)) {
    tlog.warn(name + ' already exists')
    process.exit(1)
  }

  console.log()
  tlog.plain.primary(`Welcome to ${NAME}@${VERSION}`)

  initAction(name).then(() => {
    return askQuestions(name)
  }).then((answers) => {
    // console.log(answers)
    projectName = answers.name
    npmInstall = answers.npmInstall
    // generate project
    return generateProject(answers)
  }).then(() => {
    if (npmInstall) {
      tlog.blue('Generated success, And ready to install...')
      installDependencies()
    } else {
      console.log()
      tlog.plain.success('Project generated successfully.')
      console.log()
      tlog.plain.blue('To get started: ')
      console.log()
      console.log('    cd ' + projectName)
      console.log('    npm install')
      console.log('    npm run dev')
      console.log()
    }
  })
}

function initAction(name) {
  fs.copy(__template, __temp) // clone template to temp directory
  return pify(showLoading)(1200) // mock progress
}

function showLoading(time, callback) {
  console.log()
  const spinner = ora('Initialize template...')
  spinner.start()
  setTimeout(() => {
    spinner.stop()
    callback && callback()
  }, time)
}

function askQuestions(name) {
  const description = 'A tuxt app project'
  const author = getCurrentAuthor()
  return inquirer.prompt([{
    type: 'input',
    name: 'name',
    message: `Project name (${name})`,
  }, {
    type: 'input',
    name: 'description',
    message: `Project description (${description})`,
  }, {
    type: 'input',
    name: 'author',
    message: `Project author (${author})`,
  }, {
    type: 'confirm',
    name: 'npmInstall',
    message: 'Need to `npm install` for you?',
  }]).then((answers) => {
    answers.name = answers.name || name
    answers.description = answers.description || description
    answers.author = answers.author || author
    return answers
  })
}

function getCurrentAuthor() {
  const options = {
    encoding: 'utf8'
  }
  let name, email

  try {
    name = execSync('git config --get user.name', options)
    email = execSync('git config --get user.email', options)
  } catch (e) {}

  name = name.trim().replace(/\\[fnrtv]/g, '')
  email = email.trim().replace(/\\[fnrtv]/g, '')

  return name || email
}

function generateProject({
  name,
  description,
  author,
}) {
  const promises = [updatePackageJson({
    name,
    description,
    author,
  })]

  return Promise.all(promises).then(() => {
    return fs.copy(__temp, path.resolve(projectName)).then(() => {
      return pify(rimraf)(__temp)
    })
  })
}

function updatePackageJson(data) {
  const packagePath = path.join(__temp, 'package.json')
  return fs.readJson(packagePath).then((packageJson) => {
    dependencies = Object.keys(packageJson.dependencies)
    return fs.writeJSON(packagePath, Object.assign(packageJson, data), {
      spaces: 2
    })
  })
}

function installDependencies() {
  const command = 'npm'
  const args = ['install', '--save', '--loglevel', 'notice'].concat(dependencies)
  const child = spawn(command, args, {
    cwd: path.resolve(process.cwd(), projectName),
    stdio: 'inherit',
  })
  child.on('close', (code) => {
    console.log()
    tlog.plain.success(' npm install successfully')
    console.log()
  })
}