const fs = require('fs-extra')
const execSync = require('child_process').execSync
const ora = require('ora')
const path = require('path')
const pify = require('pify')
// const semver = require('semver')
const validateNpmPackageName = require('validate-npm-package-name')
const inquirer = require('inquirer')
const spawn = require('cross-spawn')
const ejs = require('ejs')

const printer = require('../printer')
const packageJson = require('../../package.json')

module.exports = createFn

async function createFn(name) {
  if (!name) {
    name = await userEnterName()
  }

  const cwd = process.cwd()

  if ( /* current directory */ name === '.') {
    const currentName = path.basename(cwd)
    const { yes } = await inquirer.prompt({
      type: 'confirm',
      name: 'yes',
      message: `Generate project in current directory (${currentName})`,
    })

    if (!yes) {
      console.log('Generate cancelled, Please try again.')
      process.exit(1)
    }

    createProject(currentName); return
  }

  validateName(name, true)

  const targetPath = path.resolve(cwd, name)

  if (await fs.pathExists(targetPath)) {
    const { wanted } = await inquirer.prompt({
      type: 'list',
      name: 'wanted',
      message: `The directory '${name}' already exists, Do you want?`,
      choices: ['Cancel', 'New', 'Overwrite'],
    })

    if (wanted === 'Cancel') {
      process.exit(1)
    } else if (wanted === 'New') {
      name = await userEnterName(true)
    } else {
      await fs.remove(targetPath)
    }
  }

  createProject(name)

}

async function userEnterName(again) {
  const { projectName } = await inquirer.prompt({
    name: 'projectName',
    message: `Please enter ${again ? 'a new' : 'the'} project name?`,
    validate: (input) => {
      if (input === '') return 'Project name is required'
      if (validateName(input) === false) return 'Invalid project name'
      return true
    }
  })
  return projectName
}

function validateName(name, printError) {
  const result = validateNpmPackageName(name)
  if (printError && result.validForNewPackages === false) {
    const errors = result.errors || result.warnings || []
    console.log()
    printer.error('Invalid project name: ' + name)
    errors.forEach(err => printer.error(' - ' + err))
    console.log()
    process.exit(1)
  }
  return result.validForNewPackages
}

async function createProject(name) {
  console.log()
  printer.info('create-tuxt-app v' + packageJson.version)
  await pify(fakeLoading)(2000)
  const answers = await askQuestions(name)
  console.log(answers)
  const tempDir = path.resolve(__dirname, '../..', '.temp')
  await fs.copy(path.resolve(__dirname, '../..', 'src', 'template'), tempDir)
  await compileTemplate(answers)
  await generateTuxtsc(answers)
  await fs.copy(tempDir, path.resolve(process.cwd(), name))
  await installDependencies(answers)
}

function fakeLoading(time, callback) {
  console.log()
  const spinner = ora('Preparing template...').start()
  setTimeout(() => {
    spinner.stop()
    callback && callback()
  }, time)
}

function askQuestions(name) {
  return inquirer.prompt([{
      name: 'name',
      message: `Project name`,
      default: name,
    },
    {
      name: 'description',
      message: `Project description`,
      default: 'A tuxt app project',
    },
    {
      name: 'author',
      message: `Project author`,
      default: getUser(),
    },
    {
      type: 'confirm',
      name: 'vuex',
      message: 'Use vuex in your project?',
    },
    {
      type: 'list',
      name: 'install',
      message: 'Choose a package manager to install your dependencies?',
      choices: ['Npm', 'Yarn', 'None'],
    }
  ])
}

function getUser() {
  const options = { encoding: 'utf8' }
  let name = execSync('git config --get user.name', options)
  let email = execSync('git config --get user.email', options)
  name = name.trim().replace(/\n+/, '')
  email = email.trim().replace(/\n+/, '')
  return name ? name + (email ? '<' + email + '>' : '') : email || ''
}

async function compileTemplate({
  name,
  description,
  author
}) {
  const tempDir = path.resolve(__dirname, '../..', '.temp')
  const files = ['index.html', 'package.json', 'README.md']
  for (let i = 0, len = files.length; i < len; i++) {
    const file = path.join(tempDir, files[i])
    const originContent = await fs.readFile(file, 'utf8')
    const content = ejs.render(originContent, {
      name,
      description,
      author
    })
    await fs.writeFile(file, content)
  }
}

async function generateTuxtsc({
  vuex
}) {
  const tuxtrcPath = path.resolve(require('os').homedir(), '.tuxtrc')
  const data = { vuex }
  await fs.writeFile(tuxtrcPath, JSON.stringify(data, null, 2))
}

function installDependencies({
  name,
  install
}) {
  if (install) {
    const dependencies = Object.keys(require('../../.temp/package.json').dependencies)
    const command = 'npm'
    const args = ['install', '--save'].concat(dependencies, ['--loglevel', 'notice'])
    const child = spawn(command, args, {
      cwd: path.resolve(process.cwd(), name),
      stdio: 'inherit',
    })
    child.on('close', (code) => {
      console.log()
      tlog.plain.success(' npm install successfully')
      console.log()
    })
    fs.remove(path.resolve(__dirname, '../..', '.temp'))
  } else {
    console.log('Generate done.')
  }
}