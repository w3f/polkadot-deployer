const path = require('path');

const cmd = require('../../../core/cmd');
const files = require('../../../core/files');
const tpl = require('../../../tpl');


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
    await this.cmd('init');
    return this.cmd(`apply -auto-approve -var node_count=${this.config.workers} -var cluster_name=${this.config.name}`);
  }

  async destroy() {
    return this.cmd('destroy -auto-approve');
  }

  _initializeTerraform() {
    files.copyTerraformFiles(this.config.name, this.config.type);

    const terraformTplPath = files.terraformTplPath(this.config.type);
    const terraformPath = files.terraformPath(this.config.name);
    ["provider.tf"].forEach((item) => {
      const origin = path.join(terraformTplPath, item);
      const target = path.join(terraformPath, item);
      tpl.create(origin, target, this.config.remote);
    })
  }

  async _cmd(command) {
    await cmd.exec(`./terraform ${command}`, this.options);
  }
}

module.exports = {
  RemoteCluster
}
