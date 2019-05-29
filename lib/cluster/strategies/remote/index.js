

class RemoteCluster {
  constructor(config) {
    this.config = JSON.parse(JSON.stringify(config));
  }

  async create() {
  }

  async destroy() {
  }

  async _rollback() {

  }
}

module.exports = {
  RemoteCluster
}
