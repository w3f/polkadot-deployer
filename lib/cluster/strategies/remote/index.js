const { ApiPromise, WsProvider } = require('@polkadot/api');
const path = require('path');

const cmd = require('../../../core/cmd');
const files = require('../../../core/files');
const { Helm } = require('../../../clients/helm');
const { Kubectl } = require('../../../clients/kubectl');
const tpl = require('../../../tpl');


class RemoteCluster {
  constructor(config) {
    this.config = JSON.parse(JSON.stringify(config));
    this.options = [];
    this.helm = [];
    this.kubectl = [];

    for (let counter = 0; counter < this.config.remote.clusters.length; counter++) {
      const name = this._clusterName(counter);
      this._initializeTerraform(counter);

      this.options.push({
        cwd: files.terraformPath(name),
        verbose: config.verbose
      });

      config.name = name;
      this.helm.push(new Helm(config));
      this.kubectl.push(new Kubectl(config));
    }
  }

  async create() {
    const creationPromises = [];
    for (let counter = 0; counter < this.config.remote.clusters.length; counter++) {
      creationPromises.push(() => {
        return new Promise(async (resolve, reject) => {
          await this._cmd('init', counter);
          await this._cmd(`apply -auto-approve -var node_count=${this.config.workers} -var cluster_name=${this.config.name}`, counter);

          const kubeconfigContent = await this._cmd('output kubeconfig', counter, {verbose: false});
          const name = this._clusterName(counter);
          const targetKubeconfigPath = files.kubeconfigPath(name);
          resolve(files.write(targetKubeconfigPath, kubeconfigContent));
        });
      });
    }
    return Promise.all(creationPromises);
  }

  async destroy() {
    const deletionPromises = [];
    for (let counter = 0; counter < this.config.remote.clusters.length; counter++) {
      deletionPromises.push(() => {
        return new Promise(async (resolve, reject) => {
          const name = this._clusterName(counter);
          try {
            await this.helm[counter].delete();
          } catch (e) {
            console.log(`Could not delete helm resources for ${name}: ${e.message}`);
          }
          await this.kubectl[counter].deleteVolumeClaims();

          await this._cmd('init', counter);
          resolve(this._cmd('destroy -auto-approve', counter));
        });
      });
    }
    return Promise.all(deletionPromises);
  }

  async waitReady(index=0) {
    const wsEndpoint = this._wsEndpoint(index);

    const provider = new WsProvider(wsEndpoint);
    const api = await new ApiPromise(provider).isReady;

    api.disconnect();

    return { wsEndpoint };
  }

  async setConfig(config) {
    this.config = JSON.parse(JSON.stringify(config));

    for (let counter = 0; counter < this.config.remote.clusters.length; counter++) {
      this.helm[counter].setConfig(JSON.parse(JSON.stringify(config)));
    }
  }

  async installNodes() {
    const installNodesPromise = []
    for (let counter = 0; counter < this.config.remote.clusters.length; counter++) {
      installNodesPromise.push(this.helm[counter].install());
    }
    return Promise.all(installNodesPromise);
  }

  async installDeps() {
    const installDepsPromise = []
    for (let counter = 0; counter < this.config.remote.clusters.length; counter++) {
      installDepsPromise.push(this.helm[counter].installDeps());
    }
    return Promise.all(installDepsPromise);
  }

  async deleteNodes() {
    const deleteNodesPromise = []
    for (let counter = 0; counter < this.config.remote.clusters.length; counter++) {
      deleteNodesPromise.push(this.helm[counter].delete());
    }
    return Promise.all(deleteNodesPromise);
  }

  _initializeTerraform(index) {
    const name = this._clusterName(index);

    files.copyTerraformFiles(name, this.config.type);

    const terraformTplPath = files.terraformTplPath(this.config.type);
    const terraformPath = files.terraformPath(name);
    ['provider.tf', 'variables.tf'].forEach((item) => {
      const origin = path.join(terraformTplPath, item);
      const target = path.join(terraformPath, item);
      tpl.create(origin, target, this.remote.clusters[index]);
    })
  }

  async _cmd(command, index, options = {}) {
    const actualOptions = Object.assign({}, this.options[index], options)
    return await cmd.exec(`./terraform ${command}`, actualOptions);
  }

  _clusterName(index) {
    return `{this.config.name}-${index}`;
  }

  _wsEndpoint(index) {
    const name = this._clusterName(index);

    return `wss://${name}.${this.config.remote.cluster[index].domain}`;
  }
}

module.exports = {
  RemoteCluster
}
