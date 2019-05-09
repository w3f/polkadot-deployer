const chalk = require('chalk');
const process = require('process');

const db = require('../db');
const { Helm } = require('../deployment/helm');
const init = require('../init');
const inquirer = require('./inquirer');
const { Kubectl } = require('../deployment/kubectl');


module.exports = {
  do: async (name) => {
    await init.ensure();

    let config;
    if (name) {
      config = { name };
    } else {
      config = await inquirer.select();
    }

    const deployment = await db.find(config);
    if (!deployment) {
      console.log(chalk.yellow(`Deployment ${config.name} not found`));
      process.exit(1);
    }

    const helm = new Helm(deployment);

    console.log(chalk.yellow(`Redeploying ${config.name} deployment...`));
    await helm.redeploy();
    console.log(chalk.green('Done'));

    console.log(chalk.yellow(`Updating port forward...`));
    try {
      process.kill(-deployment.portForwardPID);
    } catch() {
      // FIXME: we are getting `unhandled-promise-rejection-rejection-id-1-error-kill-esrch`
      // here, but the detached process is removed
    }
    const kubectl = new Kubectl(deployment);
    const result = await kubectl.portForward('polkadot-node-0-0', 9944);
    deployment.portForwardPID= result.pid;
    deployment.wsEndpoint = `http://localhost:${result.port}`;
    await db.save(deployment);
    console.log(chalk.green('Done'));
  }
}
