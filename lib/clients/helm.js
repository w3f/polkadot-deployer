const cmd = require('../core/cmd');
const constants = require('../core/constants');
const crypto = require('../network/crypto');
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
    this.cloudflareApiKey = process.env.CLOUDFLARE_API_KEY;
    this.cloudflareEmail = process.env.CLOUDFLARE_EMAIL;

    this.mainConfig = files.readMainConfig();
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

  async installDeps(index=0, namespace='default') {
    await this._ensureInitialized();

    if (this.config.type !== 'local') {
      if (!this.config.benchmark) {
        await this._cmd(`install -n nginx-ingress --set controller.publishService.enabled=true --version ${this.mainConfig.chartVersions['nginx-ingress']} stable/nginx-ingress`);

        await this.kubectl.cmd('apply -f https://raw.githubusercontent.com/jetstack/cert-manager/release-0.6/deploy/manifests/00-crds.yaml');
        await this.kubectl.cmd(`label namespace ${namespace} certmanager.k8s.io/disable-validation=true --overwrite=true`);
        await this._cmd('repo add jetstack https://charts.jetstack.io')
        await this._cmd('repo update');
        await this._cmd(`install -n cert-manager --namespace cert-manager --version ${this.mainConfig.chartVersions['cert-manager']} jetstack/cert-manager`);
      }
      await this._cmd(`install -n external-dns --set rbac.create=true --set provider=cloudflare --set cloudflare.apiKey=${this.cloudflareApiKey} --set cloudflare.email=${this.cloudflareEmail} --set cloudflare.proxied=false --version ${this.mainConfig.chartVersions['external-dns']} stable/external-dns`);
    }


    const values = this._generateValuesFileBase(index);
    const relativeValuesFilePath = files.relativeValuesFilePath(this.config.name, 'base');
    const fullValuesFilePath = files.absoluteValuesFilePath(this.config.name, 'base');
    files.writeYAML(fullValuesFilePath, values);
    const baseVersion = this.mainConfig.chartVersions.polkadot;
    await this._cmd(`install -n polkadot-base-services -f ${relativeValuesFilePath} --version ${baseVersion} w3f/polkadot-base-services`);
    //await this._cmd(`install -n polkadot-base-services -f ${relativeValuesFilePath} /home/fgimenez/workspace/w3f/polkadot-chart/charts/polkadot-base-services`);
  }

  async install(){
    await this._ensureInitialized();

    const chartName = 'w3f/polkadot';
    const chartVersion = this.mainConfig.chartVersions.polkadot;
    for (const n of Array(this.config.nodes).keys()) {
      const name = this._nodeName(n);
      const values = this._generateValuesFile(n);
      const relativeValuesFilePath = files.relativeValuesFilePath(this.config.name, n);
      const fullValuesFilePath = files.absoluteValuesFilePath(this.config.name, n);
      files.writeYAML(fullValuesFilePath, values);

      try {
        await this._cmd(`install -n ${name} -f ${relativeValuesFilePath} --version ${chartVersion} ${chartName}`);
        //await this._cmd(`install -n ${name} -f ${relativeValuesFilePath} /home/fgimenez/workspace/w3f/polkadot-chart/charts/polkadot`);
      } catch(e) {
        console.log(`Could not install ${name}: ${e.message}`);
      }
    }
  }

  setNodes(nodes) {
    this.config.nodes = nodes;
  }
  setKeys(keys) {
    this.config.keys = {};

    const nonValidators = this._nonValidatorIndices().length;
    crypto.keyTypes().forEach((type) => {
      this.config.keys[type] = keys[type].slice(nonValidators);
    });
  }
  setSessionKeys(keys) {
    this.config.sessionKeys = keys;
  }

  setNodeKeys(nodeKeys) {
    this.config.nodeKeys = nodeKeys;
  }

  setBootNodes(bootNodes) {
    this.config.bootNodes = bootNodes;
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
    const deploymentName = this.config.deploymentName || this.config.name;
    const values = {
      name: `${this.config.name}-${index}`,
      deploymentName,
      nodeKey: this.config.nodeKeys[index].nodeKey,
      bootNodes: this.config.bootNodes,
      telemetry: this.config.telemetry || "",
      p2pPort: this._p2pPort(index)
    };
    if (this._isValidator(index)) {
      values.validator = true;
      values.key = this.config.sessionKeys[index].seed;
    }
    if (index === 0) {
      values.createBootnodeService = true;
      values.createConfigMap = true;
      values.chainspec = {
        minimumPeriod: this._minimumPeriod(),
        keys: {
          stash: this.config.keys.stash.map( item => item.address ),
          controller: this.config.keys.controller.map( item => item.address ),
          session: this.config.keys.session.map( item => item.address )
        }
      };
    }
    if (this.config.type !== 'local') {
      if (!this.config.benchmark) {
        values.persistence = {
          enabled: true
        };
      }
      values.resources = {
        requests: {
          memory: '4Gi'
        }
      };
    }
    return values;
  }

  _generateValuesFileBase(index) {
    const values = {
      name: `${this.config.name}-base`
    };
    if (this.config.benchmark) {
      values.benchmark = this.config.benchmark;
    }

    // the cluster doesn't need to be accessible remotely for local deployments
    // or benchmarks.
    if (this.config.type === 'local' ) {
      values.local = true;
    } else {
      values.domain = `${this.config.name}.${this.config.remote.clusters[index].domain}`;
      values.bootNodeP2PPort = this._p2pPort(0);
      values.cloudflareApiKey = this.cloudflareApiKey || '';
    }
    return values;
  }

  _nodeName(index) {
    return `polkadot-node-${index}`;
  }

  _minimumPeriod() {
    /*
    if (this.config.nodes <= 50) {
      return 2
    } else if (this.config.nodes <= 100) {
      return 3
    } else if (this.config.nodes <= 150) {
      return 4
    }
    return 5
    */
    return 2
  }

  _p2pPort(index) {
    return index + constants.initialP2PPort;
  }

  _nonValidatorIndices() {
    return [];
    /*
    if (this.config.typee === 'local') {
      return [];
    }
    return [0, 1];
    */
  }

  _isValidator(index) {
    return !this._nonValidatorIndices().includes(index);
  }
}

module.exports = {
  Helm
}
