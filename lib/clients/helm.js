const cmd = require('../core/cmd');
const files = require('../core/files');
const { Kubectl } = require('./kubectl');
const process = require('process');


class Helm {
  constructor(config) {
    this.config = JSON.parse(JSON.stringify(config));

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
    this.kubectl = new Kubectl(config);
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
      promises.push(this._cmd(`delete ${name} --purge`));
    }
    return Promise.all(promises);
  }

  async install(){
    await this._ensureInitialized();

    await this._installDeps();

    const chartName = 'w3f/polkadot';
    const mainConfig = files.readMainConfig();
    const chartVersion = mainConfig.chartVersion;
    for (const n of Array(this.config.nodes).keys()) {
      const name = this._nodeName(n);

      const values = this._generateValuesFile(this.config.name, n, this.config.type);
      const relativeValuesFilePath = files.relativeValuesFilePath(this.config.name, n);
      const fullValuesFilePath = files.absoluteValuesFilePath(this.config.name, n);
      files.writeYAML(fullValuesFilePath, values);

      await this._cmd(`install -n ${name} -f ${relativeValuesFilePath} --version ${chartVersion} ${chartName}`);
    }
  }

  async _cmd(command) {
    return cmd.exec(`./helm ${command}`, this.options);
  }

  async _ensureInitialized() {
    if (this.initialized) {
      return
    }
    const saList = await this.kubectl.cmd('-n kube-system get sa');
    if(!saList.toString().match(/tiller/)) {
      await this.kubectl.cmd(`-n kube-system create sa tiller`);
    }
    const cbrList = await this.kubectl.cmd('get clusterrolebinding');
    if (!cbrList.toString().match(/tiller/)) {
      await this.kubectl.cmd(`create clusterrolebinding tiller --clusterrole cluster-admin --serviceaccount=kube-system:tiller`);
    }
    await this._cmd(`init --service-account tiller --history-max=5`, this.options);

    await this.kubectl.waitPodsReady(['app=helm,name=tiller'], 'kube-system');

    await this._cmd('repo add w3f https://w3f.github.io/helm-charts/');
    await this._cmd('repo update');

    this.initialized = true;
  }

  _generateValuesFile(index) {
    const values = {
      name: `${this.config.name}-${index}`,
      key: this.config.keys.session[index].seed,
      chainspec: {
        keys: {
          stash: this.config.keys.stash.map( item => item.address ),
          controller: this.config.keys.controller.map( item => item.address ),
          session: this.config.keys.session.map( item => item.address )
        }
      }
    };
    values.nodeKey = this.config.nodeKeys[index].nodeKey;
    if (index === 0) {
      values.chainspec.createConfigmap = true;
      values.createServiceAccount = true;
      values.createNetworkPolicy = true;
      values.createPodSecurityPolicy = true;

      values.mainNodeID = this.config.nodeKeys[0].peerId;
    }
    if (this.config.type !== 'local') {
      values.externalAccess = true;
      values.cloudflareApiKey = process.env('CLOUDFLARE_API_KEY');
      values.domain = `${this.config.name}.${this.config.external.domain}`
    }

    return values;
  }

  _nodeName(index) {
    return `polkadot-node-${index}`;
  }

  async _installDeps(namespace='default') {
    await this._cmd('install -n nginx-ingress stable/nginx-ingress');

    await this.kubectl.cmd('apply -f https://raw.githubusercontent.com/jetstack/cert-manager/release-0.6/deploy/manifests/00-crds.yaml');
    await this.kubectl.cmd(`label namespace ${namespace} certmanager.k8s.io/disable-validation=true --overwrite=true`);
    await this._cmd('install -n cert-manager stable/cert-manager');
  }
}

module.exports = {
  Helm
}
