const chalk = require('chalk');
const path = require('path');
const process = require('process');

const cmd = require('../../core/cmd');
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
    this.files = new Files({dataPath: config.path});

    if (config.path !== '.' && this.files.directoryExists(config.path)) {
      console.log(chalk.red(`Directory ${config.path} already exists`))
      process.exit(1);
    }

    this.config = config;
    this.options = {
      cwd: config.path,
      verbose: config.verbose
    };
  }

  async do() {
    if (this.config.path !== '.') {
      this.files.createDirectory(this.config.path);
    }

    this._createFiles();

    await this._installDependencies();

    await this._createDeployment();

    console.log(chalk.green(`Project ${this.config.path} initialized`));
  }

  _createFiles() {
    console.log(chalk.yellow('Creating files...'))
    const source = path.join(path.dirname(module.filename), 'tpl');
    const target = path.join(this.config.path);

    this.files.copy(source, target);
    console.log(chalk.green('Done.'));
  }

  async _installDependencies() {
    console.log(chalk.yellow('Installing dependencies...'))
    await this._cmd(`npm i`);
    console.log(chalk.green('Done.'));
  }

  async _cmd(command) {
    return cmd.exec(command, this.options);
  }
}
