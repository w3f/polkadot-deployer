const portastic = require('portastic');

const cmd = require('../core/cmd');
const files = require('../core/files');


class Kubectl {
  constructor(config) {
    this.config = config;

    this.componentsPath = files.componentsPath()

    const kubeconfigPath = files.kubeconfigPath(config.name);

    this.options = {
      env: {
        KUBECONFIG: kubeconfigPath
      },
      cwd: this.componentsPath,
      verbose: config.verbose
    };
  }

  async waitNodesReady() {
    const labels = [];
    for (const n of Array(this.config.nodes).keys()) {
      labels.push(`node=polkadot-node-${n}`)
    }
    return this._waitPodsReady(labels);
  }

  async _waitPodsReady(labels, namespace='default') {
    const promises = [];
    const options = Object.assign({ matcher: new RegExp('\\s*1\\/1') }, this.options);
    labels.forEach((label) => {
      promises.push(cmd.exec(
        `./kubectl get pods -l ${label} -n ${namespace} -w`,
        options
      ));
    });
    return Promise.all(promises);
  }

  async portForward(podName, targetPort, namespace='default') {
    const port = await portastic.find({min: 11000, max: 12000});
    const options = Object.assign({
      detached: true,
      stdio: 'ignore'
    }, this.options);
    const pid = await cmd.exec(`./kubectl port-forward pods/${podName} ${port[0]}:${targetPort} -n ${namespace}`, options);

    return { pid, port: port[0] };
  }
}

module.exports = {
  Kubectl
}
