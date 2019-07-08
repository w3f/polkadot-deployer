const chalk = require('chalk');
const path = require('path');
const process = require('process');

const { Files } = require('../../core/files');
const strings = require('../../core/strings');


module.exports = {
  do: async (cmd) => {
    const pc = new ProjectCreate(cmd)
    await pc.do();
  }
}

class ProjectCreate {
  constructor(config={}) {
    if (!config.path) {
      console.log(chalk.red('Please specify a target directory with -p'));
      process.exit(1);
    }
    config.path = strings.removeSpaces(config.path);
    this.config = config;
    this.files = new Files({dataPath: config.path});
  }

  async do() {
    if (this.config.path !== '.' && this.files.directoryExists(this.config.path)) {
      console.log(chalk.red(`Directory ${this.config.path} already exists`))
    }

    if (this.config.path !== '.') {
      this.files.createDirectory(this.config.path);
    }

    this._createFiles();

    await this._installDependencies();

    await this._createDeployment();

    console.log(chalk.green(`Project ${this.config.path} initialized`));
  }

  _createFiles() {
    this._createGitIgnore();
    this._createConfig();
    this._createScripts();
  }

  async _installDependencies() {

  }

  async _createDeployment() {

  }

  _createGitIgnore() {
    const source = path.join(path.dirname(module.filename), 'tpl', '.gitignore');
    const target = path.join(this.config.path, '.gitignore');

    this.files.copy(source, target);
  }

  _createConfig() {

  }

  _createScripts() {

  }
}
