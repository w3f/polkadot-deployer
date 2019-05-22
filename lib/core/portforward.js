const chalk = require('chalk');
const { Kubectl } = require('../clients/kubectl');
const process = require('process');


module.exports = {
  create: async (deployment, options={}) => {
    const kubectl = new Kubectl(deployment);
    await kubectl.waitNodesReady();
    const result = await kubectl.portForward('polkadot-node-0-0', 9944);

    const wsEndpoint = `ws://127.0.0.1:${result.port}`

    if (!options.quiet) {
      console.log(chalk.green('*******************************************************'));
      console.log(chalk.green(` Websockets endpoint available at ${wsEndpoint} `));
      console.log(chalk.green('*******************************************************'));
      console.log('\n');
    }

    return { pid: result.pid, wsEndpoint };
  },
  delete: (pid) => {
    try {
      process.kill(-pid);
    } catch(_) {
      // FIXME: we are getting `unhandled-promise-rejection-rejection-id-1-error-kill-esrch`
      // here, but the detached process is removed
    }
  }
}
