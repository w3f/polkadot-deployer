const chalk = require('chalk');
const { LocalCluster } = require('./strategies/local');
const { RemoteCluster } = require('./strategies/remote');


class Cluster {
  constructor(config) {
    if (!config.name) {
      throw new TypeError(`config.name must not be empty`);
    }
    if (!config.type) {
      throw new TypeError(`config.type must not be empty`);
    }

    this.config = JSON.parse(JSON.stringify(config));

    this._runner = this._strategy();
  }

  get runner() {
    return this._runner;
  }

  _strategy() {
    switch(this.config.type) {
    case 'local':
      return new LocalCluster(this.config);
    default:
      return new RemoteCluster(this.config);
    }
  }

  async create() {
    return this._runner.create();
  }

  async destroy() {
    return this._runner.destroy();
  }

  setNodes(nodes) {
    this.config.nodes = nodes;
    this._runner.setNodes(nodes);
  }
  setKeys(keys) {
    this.config.keys = keys;
    this._runner.setKeys(keys);
  }
  setNodeKeys(nodeKeys) {
    this.config.nodeKeys = nodeKeys;
    this._runner.setNodeKeys(nodeKeys);
  }

  async installNodes() {
    return this._runner.installNodes();
  }

  async installDeps() {
    return this._runner.installDeps();
  }

  async deleteNodes() {
    return this._runner.deleteNodes();
  }

  async waitReady(index = 0) {
    const result = await this._runner.waitReady(index);

    console.log();
    console.log(chalk.green('*************************************************************'));
    console.log(chalk.green(` Websockets endpoint available at ${result.wsEndpoint} `));
    console.log(chalk.green('*************************************************************'));

    return result;
  }

  async getConfig() {
    return this._runner.getConfig();
  }
}

module.exports = {
  Cluster
}
