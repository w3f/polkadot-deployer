const path = require('path');
const portastic = require('portastic');

const cmd = require('../cmd');
const files = require('../files');


class Kubectl {
  constructor(config) {
    this.config = config;

    const componentsPath = files.componentsPath()
    this.kubectlPath = path.join(componentsPath, 'kubectl');

    const deploymentPath = files.deploymentPath(config.name);
    const kubeconfigPath = files.kubeconfigPath(config.name);

    this.options = {
      env: {
        KUBECONFIG: kubeconfigPath
      },
      cwd: deploymentPath
    };
  }

  async portForward(podName, targetPort) {
    const port = await portastic.find(11000, 12000)

    const options = Object.assign({
      detached: true,
      stdio: ['ignore']
    }, this.options);
    const pid = await cmd.exec(`port-forward pods/${podName} ${port}:${targetPort}`, options);
    return { pid, port };
  }

  async cmd(command) {
    await cmd.exec(`${this.kubectlPath} ${command}`, this.options);
  }
}

module.exports = {
  Kubectl
}
