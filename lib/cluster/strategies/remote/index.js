const cmd = require('../../../core/cmd');
const files = require('../../../core/files');


class RemoteCluster {
  constructor(config) {
    this.config = JSON.parse(JSON.stringify(config));

    this._initializeTerraform();

    this.options = {
      cwd: files.terraformPath(config.name),
      verbose: config.verbose
    };
  }

  async create() {
    return this.cmd(`apply -auto-approve -var worker_count=${this.config.workers} -var name=${this.config.name}`);
  }

  async destroy() {
    return this.cmd('destroy -auto-approve');
  }

  _initializeTerraform() {
    files.copyTerraformFiles(this.config.name, this.config.type);
  }

  async _cmd(command) {
    await cmd.exec(`./terraform ${command}`, this.options);
  }
}

module.exports = {
  RemoteCluster
}
