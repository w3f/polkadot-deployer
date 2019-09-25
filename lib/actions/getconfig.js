const chalk = require('chalk');
const process = require('process');

//const { Cluster } = require('../cluster');
//const db = require('../core/db');
const { Files } = require('../core/files');
const init = require('../init');
const inquirer = require('./inquirer');
const { Validation } = require('../validation');


module.exports = {
  do: async (cmd) => {
    const files = new Files();

    let config;
    if (cmd.config) {
      config = files.readJSON(cmd.config);
      const validator = new Validation();
      if (!validator.run(config)) {
        process.exit(1);
      }
    } else {
      config = await inquirer.getConfig();
    }

    if (config.type === 'local') {
      console.log(chalk.red('getConfig action only works for remote deployments'));
      process.exit(1);
    }

    config.verbose = cmd.verbose;
    config.dataPath = cmd.data;

    await init.ensure(config);

    return getConfig(config);
  }
}

function getConfig() {

}
