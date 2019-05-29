const { LocalCluster } = require('./strategies/local');


class Cluster {
  constructor(config) {
    this.config = JSON.parse(JSON.stringify(config));

    this._runner = this._strategy();
  }

  _strategy() {
    switch(this.config.type) {
    case 'local':
      return new LocalCluster(this.config);
    }
  }

  async create() {
    return this._runner.create();
  }

  async destroy() {
    return this._runner.destroy();
  }
}

module.exports = {
  Cluster
}
