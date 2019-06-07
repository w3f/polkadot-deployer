const waitOn = require('wait-on');

const cmd = require('../../../core/cmd');
const download = require('../../../core/download');
const files = require('../../../core/files');
const { Helm } = require('../../../clients/helm');
const portforward = require('../../../core/portforward');


class LocalCluster {
  constructor(config) {
    this.config = JSON.parse(JSON.stringify(config));

    this.helm = new Helm(config);
  }

  async create() {
    try {
      await cmd.exec(`docker run -d --privileged --name ${this.config.name} -p 8443:8443 -p 10080:10080 bsycorp/kind:latest-1.12`, {verbose: this.config.verbose});
    } catch (err) {
      console.error(`Could not create local deployment: ${err.message}`);
      throw err;
    }

    try {
      await waitOn({
        resources: ['http://127.0.0.1:10080/kubernetes-ready'],
        log: this.config.verbose
      });
    } catch (err) {
      console.error(`Could not get k8s ready file: ${err.message}`);
      await this._rollback();
      throw err;
    }

    const kubeconfigPath = files.kubeconfigPath(this.config.name);

    try {
      await download.file('http://127.0.0.1:10080/config', kubeconfigPath);
    } catch (err) {
      console.error(`Could not download k8s config: ${err.message}`);
      await this._rollback();
      throw err;
    }
  }

  async destroy() {
    try {
      await cmd.exec(`docker rm -f ${this.config.name}`, {verbose: this.config.verbose});
    } catch (err) {
      console.error(`Could not delete local deployment: ${err.message}`);
    }
    portforward.delete(this.config.portForwardPID);
  }

  async waitReady() {
    return portforward.create(this.config);
  }

  async setConfig(config) {
    this.config = JSON.parse(JSON.stringify(config));

    return this.helm.setConfig(JSON.parse(JSON.stringify(config)));
  }

  setNodes(nodes) {
    this.config.nodes = nodes;
    this.helm.setNodes(nodes);
  }
  setKeys(keys) {
    this.config.keys = keys;
    this.helm.setKeys(keys);
  }
  setNodeKeys(nodeKeys) {
    this.config.nodeKeys = nodeKeys;
    this.helm.setNodeKeys(nodeKeys);
  }

  async installNodes() {
    const bootNodes = this._bootNodes();
    this.helm.setBootNodes(bootNodes);
    return this.helm.install();
  }

  async installDeps() {
    return this.helm.installDeps();
  }

  async deleteNodes() {
    return this.helm.delete();
  }

  async _rollback() {
    await cmd.exec(`docker rm -f ${this.config.name}`, {verbose: this.config.verbose});
  }

  _bootNodes() {
    return `/dns4/polkadot-node-0/tcp/30333/p2p/${this.config.nodeKeys[0].peerId}`;
  }
}

module.exports = {
  LocalCluster
}
