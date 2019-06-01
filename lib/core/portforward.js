const { Kubectl } = require('../clients/kubectl');
const process = require('process');


module.exports = {
  create: async (deployment) => {
    const kubectl = new Kubectl(deployment);
    await kubectl.waitNodesReady();
    const result = await kubectl.portForward('polkadot-node-0-0', 9944);

    const wsEndpoint = `ws://127.0.0.1:${result.port}`

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
