const files = require('../../../core/files');


class RemoteCluster {
  constructor(config) {
    this.config = JSON.parse(JSON.stringify(config));

    this._initializeTerraform();
  }

  async create() {

  }

  async destroy() {

  }

  async _rollback() {

  }

  _initializeTerraform() {
    files.copyTerraformFiles(this.config.name, this.config.type);
  }
}

module.exports = {
  RemoteCluster
}
