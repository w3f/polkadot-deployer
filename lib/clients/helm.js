const cmd = require('../local/cmd');
const files = require('../local/files');
const keys = require ('../network/keys');


class Helm {
  constructor(config) {
    this.config = config;

    this.componentsPath = files.componentsPath()

    const kubeconfigPath = files.kubeconfigPath(config.name);

    this.options = {
      env: {
        KUBECONFIG: kubeconfigPath,
        HELM_HOME: this.componentsPath
      },
      cwd: this.componentsPath,
      verbose: config.verbose
    };
    this.initialized = false;
  }

  async setConfig(config) {
    this.config = config;
  }

  async redeploy() {
    this.initialized = true;
    await this.delete();
    await this.install();
  }

  async delete() {
    await this._ensureInitialized();

    const promises = [];
    for (const n of Array(this.config.nodes).keys()) {
      const name = this._nodeName(n);
      promises.push(this.cmd(`delete ${name} --purge`));
    }
    return Promise.all(promises);
  }

  async install(){
    await this._ensureInitialized();

    const chartName = 'w3f/polkadot';
    const mainConfig = files.readMainConfig();
    const chartVersion = mainConfig.chartVersion;
    for (const n of Array(this.config.nodes).keys()) {
      const name = this._nodeName(n);

      const values = this._generateValuesFile(this.config.name, n);
      const relativeValuesFilePath = files.relativeValuesFilePath(this.config.name, n);
      const fullValuesFilePath = files.absoluteValuesFilePath(this.config.name, n);
      files.writeYAML(fullValuesFilePath, values);

      await this.cmd(`install -n ${name} -f ${relativeValuesFilePath} --version ${chartVersion} ${chartName}`);
    }
  }

  async cmd(command) {
    await cmd.exec(`./helm ${command}`, this.options);
  }

  async _ensureInitialized() {
    if (this.initialized) {
      return
    }
    const saList = await cmd.exec('./kubectl -n kube-system get sa', this.options);
    if(!saList.toString().match(/tiller/)) {
      await cmd.exec(`./kubectl -n kube-system create sa tiller`, this.options);
    }
    const cbrList = await cmd.exec('./kubectl get clusterrolebinding', this.options);
    if (!cbrList.toString().match(/tiller/)) {
      await cmd.exec(`./kubectl create clusterrolebinding tiller --clusterrole cluster-admin --serviceaccount=kube-system:tiller`, this.options);
    }
    await this.cmd(`init --service-account tiller --history-max=5`, this.options);

    const matcherOptions = Object.assign({ matcher: /\s*1\/1\s*/m }, this.options);
    await cmd.exec(
      `./kubectl get pods -l app=helm,name=tiller -n kube-system -w`,
      matcherOptions
    );

    await this.cmd('repo add w3f https://w3f.github.io/helm-charts/');
    await this.cmd('repo update');

    this.initialized = true;
  }

  _generateValuesFile(name, index) {
    const values = {
      name: `${name}-${index}`,
      key: keys.sessionKey(this.config, index),
      chainspec: {
        keys: {
          stash: this.config.keys.stash,
          controller: this.config.keys.controller,
          session: this.config.keys.session
        }
      }
    };
    if (index === 0) {
      values.mainNode = true;
      values.chainspec.createConfigmap = true;
    }
    return values;
  }

  _nodeName(index) {
    return `polkadot-node-${index}`;
  }
}

module.exports = {
  Helm
}
