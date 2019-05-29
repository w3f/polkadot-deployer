const { LocalCluster } = require('./strategies/local');
const { RemoteCluster } = require('./strategies/remote');


class Cluster {
  constructor(config) {
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
}

module.exports = {
  Cluster
}
