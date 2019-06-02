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

    this._initializeTerraform();

    this.options = {
      cwd: files.terraformPath(config.name),
      verbose: config.verbose
    };
    this.helm = new Helm(config);
    this.kubectl = new Kubectl(config);
  }

  async create() {
    await this._cmd('init');
    await this._cmd(`apply -auto-approve -var node_count=${this.config.workers} -var cluster_name=${this.config.name}`);

    const kubeconfigContent = await this._cmd('output kubeconfig', {verbose: false});
    const targetKubeconfigPath = files.kubeconfigPath(this.config.name);
    files.write(targetKubeconfigPath, kubeconfigContent);
  }

  async destroy() {
    await this.helm.delete();
    await this.kubectl.deleteVolumeClaims();

    await this._cmd('init');
    return this._cmd('destroy -auto-approve');
  }

  async waitReady() {
    const wsEndpoint = `wss://${this.config.name}.${this.config.remote.domain}`;

    const provider = new WsProvider(wsEndpoint);
    const api = await new ApiPromise(provider).isReady;

    api.disconnect();

    return { wsEndpoint };
  }

  _initializeTerraform() {
    files.copyTerraformFiles(this.config.name, this.config.type);

    const terraformTplPath = files.terraformTplPath(this.config.type);
    const terraformPath = files.terraformPath(this.config.name);
    ['provider.tf', 'variables.tf'].forEach((item) => {
      const origin = path.join(terraformTplPath, item);
      const target = path.join(terraformPath, item);
      tpl.create(origin, target, this.config.remote);
    })
  }

  async _cmd(command, options = {}) {
    const actualOptions = Object.assign({}, this.options, options)
    return await cmd.exec(`./terraform ${command}`, actualOptions);
  }
}

module.exports = {
  RemoteCluster
}
