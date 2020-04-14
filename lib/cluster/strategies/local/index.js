const path = require('path');

const cmd = require('../../../core/cmd');
const { Files } = require('../../../core/files');
const { Helm } = require('../../../clients/helm');
const portforward = require('../../../core/portforward');


class LocalCluster {
  constructor(config) {
    this.config = JSON.parse(JSON.stringify(config));

    this.helm = new Helm(config);
    this.files = new Files(config);

    this.componentsPath = this.files.componentsPath();

    this.options = {
      cwd: this.componentsPath,
      verbose: config.verbose
    };
  }

  async create() {
    try {
      await this._cmd(`create cluster --name=${this.config.name}`);
    } catch (err) {
      console.error(`Could not create local deployment: ${err.message}`);
      throw err;
    }
    const sourceKubeconfigContent = await this._cmd(`get kubeconfig --name=${this.config.name}`, {verbose: false});
    const targetKubeconfigPath = this.files.kubeconfigPath(this.config.name);
    this.files.createDirectory(path.dirname(targetKubeconfigPath));
    this.files.write(targetKubeconfigPath, sourceKubeconfigContent);
  }

  async destroy() {
    try {
      await this._cmd(`delete cluster --name=${this.config.name}`);
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
    this.helm.setSessionKeys(keys);
  }
  setNodeKeys(nodeKeys) {
    this.config.nodeKeys = nodeKeys;
    this.helm.setNodeKeys(nodeKeys);
  }

  async installNodes() {
    const bootNodes = this._bootNodes();
    this.helm.setBootNodes(bootNodes);
    this.helm.setSessionKeys(this.config.keys);
    return this.helm.install();
  }

  async installDeps() {
    return this.helm.installDeps();
  }

  async deleteNodes() {
    return this.helm.delete();
  }

  async _cmd(command, options = {}) {
    const actualOptions = Object.assign({}, this.options, options);
    return cmd.exec(`./kind ${command}`, actualOptions);
  }


  async _rollback() {
    await cmd.exec(`docker rm -f ${this.config.name}`, {verbose: this.config.verbose});
  }

  _bootNodes() {
    return [`/dns4/polkadot-node-0-p2p/tcp/30100/p2p/${this.config.nodeKeys[0].peerId}`];
  }
}

module.exports = {
  LocalCluster
}
