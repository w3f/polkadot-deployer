const chalk = require('chalk');
const process = require('process');
const { Kubectl } = require('./deployment/kubectl');


module.exports = {
  create: async (deployment) => {
    const kubectl = new Kubectl(deployment);
    const result = await kubectl.portForward('polkadot-node-0-0', 'app=polkadot-node-0', 9944);

    const wsEndpoint = `http://localhost:${result.port}`

    console.log(chalk.green('*********************************************************'));
    console.log(chalk.green(` Websockets endpoint available at ${wsEndpoint} `));
    console.log(chalk.green('*********************************************************'));
    console.log('\n');

    return { pid: result.pid, wsEndpoint };
  },
  delete: (deployment) => {
    try {
      process.kill(-deployment.portForwardPID);
    } catch(_) {
      // FIXME: we are getting `unhandled-promise-rejection-rejection-id-1-error-kill-esrch`
      // here, but the detached process is removed
    }
  }
}
