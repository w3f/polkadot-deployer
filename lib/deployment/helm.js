const path = require('path');

const cmd = require('../cmd');
const files = require('../files');


class Helm {
  constructor(config) {
    this.config = config;

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
    this.tillerInitialized = false;
  }

  async redeploy() {
    this.tillerInitialized = true;
    await this.delete();
    await this.install();
  }

  async delete() {
    await this._ensureTiller();

    for (const n of Array(this.config.nodes).keys()) {
      const name=`polkadot-node-${n}`;
      await this.cmd(`delete ${name} --purge`);
    }
  }

  async install(){
    await this._ensureTiller();

    const chartPath = path.join(path.dirname(module.filename), '..', '..', 'charts', 'polkadot');
    for (const n of Array(this.config.nodes).keys()) {
      const name=`polkadot-node-${n}`;
      if (n=== 0){
        await this.cmd(`install -n ${name} --set name=${name} ${chartPath}`);
      } else {
        const key = this._key(n);
        await this.cmd(`install -n ${name} --set name=${name} --set key=//${key} --set mainNode=false ${chartPath}`);
      }
    }
  }

  async cmd(command) {
    await cmd.exec(`${this.helmPath} ${command}`, this.options);
  }

  async _ensureTiller() {
    if (this.tillerInitialized) {
      return
    }
    await cmd.exec(`${this.kubectlPath} -n kube-system create sa tiller`, this.options);
    await cmd.exec(`${this.kubectlPath} create clusterrolebinding tiller --clusterrole cluster-admin --serviceaccount=kube-system:tiller`, this.options);

    await this.cmd(`init --service-account tiller --history-max=5`, this.options);

    const options = Object.assign({ matcher: /tiller-deploy-.*\s*1\/1\s*Running/ }, this.options);
    await cmd.exec(
      `${this.kubectlPath} get pods -l app=helm,name=tiller -n kube-system -w`,
      options
    );
    this.tillerInitialized = true;
  }

  _key(n) {
    const keys = ['Alice', 'Bob', 'Charlie', 'Dave', 'Eve', 'Ferdie'];
    return keys[n];
  }
}

module.exports = {
  Helm
}
