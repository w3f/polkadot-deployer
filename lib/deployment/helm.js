const path = require('path');

const cmd = require('../cmd');
const files = require('../files');


class Helm {
  constructor(config) {
    const componentsPath = files.componentsPath()
    this.helmPath = path.join(componentsPath, 'helm');
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

  async install(){
    await this._ensureTiller();


  }

  async cmd(command) {
    await cmd.exec(`${this.helmPath} ${command}`, this.options);
  }

  async _ensureTiller() {
    await cmd.exec(`${this.helmPath} init`, this.options);

    const options = Object.assign({ matcher: /tiller-deploy-.*\s*1\/1\s*Running/ }, this.options);
    await cmd.exec(
      `${this.kubectlPath} get pods -l app=helm,name=tiller -n kube-system -w`,
      options
    );
  }
}

module.exports = {
  Helm
}
