const cmd = require('../core/cmd');
const constants = require('../core/constants');
const crypto = require('../network/crypto');
const domain = require('../network/domain');
const { Files } = require('../core/files');
const { Kubectl } = require('./kubectl');
const nameLib = require('../network/name');
const namespace = require('../core/namespace');
const process = require('process');
const tpl = require('../tpl');
const path = require('path');
const asyncUtils = require('../core/async')

const MONITORING_NAMESPACE='monitoring'
const INGRESS_NAMESPACE='ingress'
const CERT_MANAGER_NAMESPACE='cert-manager'

class Helm {
  constructor(config) {
    this.config = JSON.parse(JSON.stringify(config));
    this.files = new Files(config);

    this.componentsPath = this.files.componentsPath();

    const kubeconfigPath = this.files.kubeconfigPath(config.name);


    this.options = {
      env: {
        KUBECONFIG: kubeconfigPath,
        HELM_HOME: this.componentsPath,
        PATH: `${this.componentsPath}:${process.env.PATH}`,
        AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
        AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID
      },
      cwd: this.componentsPath,
      verbose: config.verbose
    };
    this.initialized = false;
    this.kubectl = new Kubectl(config);
    this.cloudflareApiKey = process.env.CLOUDFLARE_API_KEY || '';
    this.cloudflareEmail = process.env.CLOUDFLARE_EMAIL || '';
    this.grafanaPassword = process.env.GRAFANA_PASSWORD || constants.defaultGrafanaPassword;
    this.grafanaAdmin = process.env.GRAFANA_ADMIN || constants.defaultGrafanaAdmin;
    this.botUser = process.env.MATRIXBOT_USER || '';
    this.botPassword = process.env.MATRIXBOT_PASSWORD || '';
    this.botRoomId = process.env.MATRIXBOT_ROOM_ID || '';
    this.botHomeserver = process.env.MATRIXBOT_HOMESERVER || '';
    this.opsgenie_token = process.env.OPSGENIE_TOKEN || 'opsgenie_token';

    this.namespace = namespace.get(config);

    this.mainConfig = this.files.readMainConfig();
    this.setKeys(config.keys);
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
      promises.push(this._cmd(`delete ${name}`));
    }
    return Promise.all(promises);
  }

  async installDeps(index=0) {
    await this._ensureInitialized();
    console.log("Installing dependencies")

    this.files.copyChartTemplates(this.config.name);

    await this._ensureNamespacesInitialized();

    await this._createNamespace(this.namespace);
    if (this.config.type !== 'local') {
      await this._installPolkadotSecretsCloudflare(index);

      if (!this.config.benchmark) {
        await this._installCertManager();

        await this._installNgixIngress();

        if (this.config.monitoring && this.config.monitoring.enabled){
          await this._installMonitoringStack(index);
        }
      }
      await this._installExternalDNS();
    }
    await this._installPolkadotBaseServices(index);
  }

  async deleteDeps(index) {
    const promises = [];
    const deps = ['polkadot-base-services'];
    if (this.config.type !== 'local') {
      deps.push('polkadot-secrets', 'external-dns');
      if (!this.config.benchmark) {
        deps.push('ingress-nginx', CERT_MANAGER_NAMESPACE);
        if (this.config.monitoring && this.config.monitoring.enabled) {
          deps.push('prometheus-operator', 'prometheus-node-exporter', 'grafana', 'loki-stack', 'matrixbot', 'substrate-alertrules');
          if (this._isSubstrateTelemetryServerRequired(index)) {
            deps.push('substrate-telemetry');
          }
        }
      }
    }
    deps.forEach((dep) => {
      promises.push(this._cmd(`delete ${dep}`));
    });
    return Promise.all(promises);
  }

  async install(){
    await this._ensureInitialized();

    for (const n of Array(this.config.nodes).keys()) {
      await this._installPolkadot(n)
    }
  }

  setNodes(nodes) {
    this.config.nodes = nodes;
  }
  setKeys(keys) {
    this.keys = keys;
  }
  setSessionKeys(keys) {
    const sessionTypes = crypto.sessionTypes();

    this.config.sessionKeys = {};

    sessionTypes.forEach((type) => {
      this.config.sessionKeys[type] = keys[type];
    });
  }

  setNodeKeys(nodeKeys) {
    this.config.nodeKeys = nodeKeys;
  }

  setBootNodes(bootNodes) {
    this.config.bootNodes = bootNodes;
  }

  setExtraBootnodes(extraBootnodes) {
    this.config.extraBootnodes = extraBootnodes;
  }

  async _cmd(command) {
    return cmd.exec(`./helm ${command}`, this.options);
  }

  async _ensureInitialized() {
    if (this.initialized) {
      return
    }

    await this._addRepos()
    this.initialized = true;
  }

  async _addRepos() {
    await this._cmd('repo add w3f https://w3f.github.io/helm-charts/');
    await this._cmd('repo add jetstack https://charts.jetstack.io')
    await this._cmd('repo add loki https://grafana.github.io/loki/charts');
    await this._cmd('repo add center https://repo.chartcenter.io');
    await this._cmd('repo update');
  }

  _generateValuesFile(index) {
    const values = {
      name: this.config.remote.clusters[index].binaryArgs ? this.config.remote.clusters[index].binaryArgs.name : nameLib.generate(this.config.name, index),
      deploymentName: this._deploymentName(),
      networkName: this._networkName(),
      nodeKey: this.config.nodeKeys[index].nodeKey,
      p2pPort: this._p2pPort(index),
      resources: this.config.resources || {},
      chainspec: {
        custom: this.config.chainspec.custom
      },
      extraArgs: this.config.extraArgs || {}
    };
    if (this.config.chainspec.preset) {
      values.chainspec.preset = this.config.chainspec.preset;
    }
    if (this.config.chainspec.name) {
      values.chainspec.name = this.config.chainspec.name;
    }
    if (this._isValidator(index)) {
      values.validator = true;
      const numberOfNonValidators = this._nonValidatorIndices().length;
      values.keys = {};
      const sessionTypes = crypto.sessionTypes();
      sessionTypes.forEach((type) => {
        values.keys[type] = this.config.sessionKeys[type][index - numberOfNonValidators].seed;
      });
      values.extraBootnodes = this.config.extraBootnodes || [];
    } else {
      values.validator = false;
    }
    if (this.config.type !== 'local' && this.config.monitoring && this.config.monitoring.enabled) {
      values.monitoring = true;
      values.telemetry = domain.telemetrySubmitUrl(this.config.networkName, this.config);
    }
    if (index === 0) {
      values.createBootnodeService = true;
      if (this.config.chainspec.custom) {
        values.createConfigMap = true;
        values.bootNodes = this.config.bootNodes;

        values.chainspec.addresses = {};
        const keyTypes = crypto.keyTypes();
        keyTypes.forEach((type) => {
          values.chainspec.addresses[type] = this.keys[type].map( item => item.address );
        });
      }
    }
    if (this.config.type !== 'local') {
      if (!this.config.benchmark) {
        if(!this.config.persistence) {
          values.persistence = {
            enabled: true,
            dataSize: '200Gi'
          };
        } else {
          values.persistence = this.config.persistence
        }
      }
      if (values.resources === {}) {
        values.resources = {
          requests: {
            memory: '4Gi'
          }
        };
      }
    } else {
      values.local = true;
      // do not enable extenal nameservers on local deployments
      values.dnsNameservers = null;
    }
    if (this.config.image && (this.config.image.repo || this.config.image.tag)) {
      values.image = {};
      if (this.config.image.repo) {
        values.image.repo = this.config.image.repo;
      }
      if (this.config.image.tag) {
        values.image.tag = this.config.image.tag;
      }
    }
    if (this.config.initImage && (this.config.initImage.repo || this.config.initImage.tag)) {
      values.initImage = {};
      if (this.config.initImage.repo) {
        values.initImage.repo = this.config.initImage.repo;
      }
      if (this.config.initImage.tag) {
        values.initImage.tag = this.config.initImage.tag;
      }
    }
    if (this.config.nodeRestart) {
      values.nodeRestart = this.config.nodeRestart;
    }

    return values;
  }

  _generateValuesFileBase(clusterIndex) {
    const deploymentName = this._deploymentName();
    const values = {
      websocketsSelector: this._nodeName(0),
      deploymentName,
      grafana:{
        namespace: MONITORING_NAMESPACE
      }
    };
    if (this.config.benchmark) {
      values.benchmark = this.config.benchmark;
    }

    // the cluster doesn't need to be accessible remotely for local deployments
    // or benchmarks.
    if (this.config.type === 'local' ) {
      values.local = true;
      values.createCertIssuer = false;
      values.createWebsocketsCertificate = false;
      values.createWebsocketsService = false;
      values.createWebsocketsIngress = false
    } else {
      values.domain = domain.default(this.config.name, this.config.remote, clusterIndex);
      values.bootNodeP2PPort = this._p2pPort(0);
      values.cloudflareEmail = this.cloudflareEmail;
      values.monitoring = (this.config.monitoring && this.config.monitoring.enabled) || false;

      if (this.config.remote.clusters[clusterIndex].validatorBootnode) {
        values.includeValidatorBootNode = true;
        values.validatorBootNodeP2PPort = this._p2pPort(1);
      }
    }

    return values;
  }

  _generateValuesFileSecretsCloudflare() {
    const values = {
      cloudflareSecret: {},
      grafanaSecret: {}
    };

    // the cluster doesn't need to be accessible remotely for local deployments
    // or benchmarks.
    if (this.config.type === 'local' ) {
      values.grafanaSecret.create = false;
      values.cloudflareSecret.create = false;
    } else {
      values.grafanaSecret.create = false;

      values.cloudflareSecret.create = true;
      values.cloudflareSecret.apiKey = this.cloudflareApiKey;
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
    return this.config.nonValidatorIndices || [];
  }

  _isValidator(index) {
    return !this._nonValidatorIndices().includes(index);
  }

  async _installCertManager() {
    // FIXME: only install cert-manager CRDs if they don't exist,
    // see https://cert-manager.io/docs/installation/upgrading/upgrading-0.15-0.16/#issue-with-older-versions-of-kubectl
    // for details. Once the patch mentioned is available in helm we should use the helm value installCRDs=true instead
    const crdList = await this.kubectl.cmd('get crds');
    if(!crdList.toString().match(/cert-manager/)) {
      await this.kubectl.cmd(`apply --validate=false -f https://github.com/jetstack/cert-manager/releases/download/${this.mainConfig.chartVersions['cert-manager']}/cert-manager.crds.yaml`);
    }
    try {
      await this._cmd(`upgrade --install cert-manager --namespace cert-manager --version ${this.mainConfig.chartVersions['cert-manager']} jetstack/cert-manager`);
      await this.kubectl.waitPodsReady(['app=webhook,app.kubernetes.io/instance=cert-manager'], 'cert-manager');
    } catch(e) {
      console.log(`Error installing cert-manager: ${e}`);
    }
  }

  async _installNgixIngress() {
    return this._installGenericChart('ingress-nginx','center/kubernetes-ingress-nginx',INGRESS_NAMESPACE);
  }

  async _installExternalDNS() {
    const data = {
      cloudflareApiKey: this.cloudflareApiKey,
      cloudflareEmail: this.cloudflareEmail
    }
    return this._installTemplatedChart('external-dns', data, 'center/bitnami',INGRESS_NAMESPACE);
  }

  async _installMonitoringStack(index) {
    await this._installPrometheusOperator();
    await this._installPrometheusNodeExporter();
    await this._installGrafana();
    await this._installLoki();
    await this._installMatrixbot();
    await this._installSubstrateAlertrules();

    if (this._isSubstrateTelemetryServerRequired(index)){
      await this._installSubstrateTelemetry();
    }
  }

  _isSubstrateTelemetryServerRequired(index){
    const telemetryConfig = this.config.monitoring.telemetry
    if(!telemetryConfig){
      return index === 0
    }

    const telemetryServerConfig = telemetryConfig.server
    return telemetryServerConfig && telemetryServerConfig.enabled && index == telemetryServerConfig.clusterIndex
  }

  async _installPrometheusOperator() {
    let opsgenieEnabled = false;
    let opsgenieHeartbeatEnabled = false;
    let opsgenieUrl = '';
    if (this.config.monitoring.opsgenie) {
      opsgenieEnabled = this.config.monitoring.opsgenie.enabled;
      opsgenieUrl = this.config.monitoring.opsgenie.url;
      opsgenieHeartbeatEnabled = opsgenieEnabled && this.config.monitoring.opsgenie.heartbeatEnabled
    }
    const data = {
      opsgenieEnabled,
      opsgenieHeartbeatEnabled,
      opsgenieUrl,
      opsgenieToken : this.opsgenie_token,
      deploymentName: this.namespace
      }
    return this._installTemplatedChart('kube-prometheus-stack', data, 'center/prometheus-community',MONITORING_NAMESPACE,'prometheus-operator');
  }

  async _installPrometheusNodeExporter() {
    return this._installGenericChart('prometheus-node-exporter', 'center/prometheus-community', MONITORING_NAMESPACE);
  }

  async _installGrafana() {
    const data = {
      adminPassword: this.grafanaPassword,
      adminUser: this.grafanaAdmin
    }
    
    return this._installTemplatedChart('grafana', data, 'center/grafana',MONITORING_NAMESPACE);
  }

  async _installLoki() {
    return this._installGenericChart('loki-stack', 'loki', MONITORING_NAMESPACE);
  }

  async _installMatrixbot() {
    const data = {
      botUser: this.botUser,
      botPassword: this.botPassword,
      roomId: this.botRoomId,
      homeserver: this.botHomeserver
    }
    return this._installTemplatedChart('matrixbot', data, 'w3f', MONITORING_NAMESPACE);
  }

  async _installSubstrateTelemetry() {
    const telemetryDomain = domain.default(this.config.name, this.config.remote);
    const subscribedChain = this.config.monitoring.subscribedChain || constants.defaultSubscribedChain;
    const imageTag = this.mainConfig.chartVersions['substrate-telemetry'];
    const data = {
      telemetryDomain,
      subscribedChain,
      imageTag
    };

    return this._installTemplatedChart('substrate-telemetry', data, 'w3f', this.namespace);
  }

  async _installGenericChart(chart, repo='center', namespace='default') {
    this.files.copyChartValuesFiles(this.config.name, chart);
    const chartValuesPath = this.files.chartValuesPath(this.config.name, chart);
    
    const cmd = `upgrade --install ${chart} -f ${chartValuesPath} --version ${this.mainConfig.chartVersions[chart]} --namespace ${namespace} ${repo}/${chart}`
    console.log(cmd)
    await this._cmd(cmd);
  }

  async _installTemplatedChart(name, data, repo='center', namespace='default', releaseName=name) {
    const source = path.join(this.files.projectConfigPath(), 'charts', 'templates', `${name}.tpl`);
    const target = this.files.chartValuesPath(this.config.name, name);
    tpl.create(source, target, data)

    const cmd = `upgrade --install ${releaseName} -f ${target} --version ${this.mainConfig.chartVersions[name]} --namespace ${namespace} ${repo}/${name}`
    console.log(cmd)
    await this._cmd(cmd);
  }

  async _installPolkadot(index) {
    const chartName = 'w3f/polkadot';
    const chartVersion = this.mainConfig.chartVersions['polkadot'];
    const name = this._nodeName(index);
    const values = this._generateValuesFile(index);
    const relativeValuesFilePath = this.files.relativeValuesFilePath(this.config.name, index);
    const fullValuesFilePath = this.files.absoluteValuesFilePath(this.config.name, index);

    this.files.writeYAML(fullValuesFilePath, values);

    try {
      const cmd = `upgrade --install ${name} -f ${relativeValuesFilePath} --version ${chartVersion} --namespace ${this.namespace} ${chartName}`
      console.log(cmd)
      await this._cmd(cmd);
    } catch(e) {
      console.log(`Could not install ${name}: ${e.message}`);
    }

  }

  async _installSubstrateAlertrules() {
    const chartName = 'substrate-alertrules';    
    const data = {
      deploymentName: this._deploymentName(),
      monitoring: this.config.monitoring && this.config.monitoring.enabled
    }
    
    return this._installTemplatedChart(chartName, data, 'w3f', MONITORING_NAMESPACE);
  }

  async _installPolkadotBaseServices(index) {
    const values = this._generateValuesFileBase(index);
    const relativeValuesFilePath = this.files.relativeValuesFilePath(this.config.name, 'base');
    const fullValuesFilePath = this.files.absoluteValuesFilePath(this.config.name, 'base');
    this.files.writeYAML(fullValuesFilePath, values);
    const baseVersion = this.mainConfig.chartVersions.polkadot;

    const cmd = `upgrade --install polkadot-base-services -f ${relativeValuesFilePath} --version ${baseVersion} --namespace ${this.namespace} w3f/polkadot-base-services`
    console.log(cmd)
    await this._cmd(cmd);
    //await this._cmd(`upgrade --install polkadot-base-services -f ${relativeValuesFilePath} --namespace ${this.namespace} /home/fgimenez/workspace/w3f/polkadot-chart/charts/polkadot-base-services`);
  }

  async _installPolkadotSecretsCloudflare() {
    const values = this._generateValuesFileSecretsCloudflare();
    const relativeValuesFilePath = this.files.relativeValuesFilePath(this.config.name, 'secretsCloudflare');
    const fullValuesFilePath = this.files.absoluteValuesFilePath(this.config.name, 'secretsCloudflare');
    this.files.writeYAML(fullValuesFilePath, values);
    const baseVersion = this.mainConfig.chartVersions.polkadot;

    const cmd = `upgrade --install polkadot-secrets-cloudflare -f ${relativeValuesFilePath} --version ${baseVersion} --namespace ${CERT_MANAGER_NAMESPACE} w3f/polkadot-secrets`
    console.log(cmd)
    await this._cmd(cmd);
    //await this._cmd(`upgrade --install polkadot-secrets -f ${relativeValuesFilePath} --namespace ${this.namespace} /home/fgimenez/workspace/w3f/polkadot-chart/charts/polkadot-secrets`);
  }

  async _ensureNamespacesInitialized() {
    const required = [CERT_MANAGER_NAMESPACE,MONITORING_NAMESPACE,INGRESS_NAMESPACE];
    return asyncUtils.forEach( required, async (r) => await this._createNamespace(r) );
  }

  async _createNamespace(ns) {
    const nsList = await this.kubectl.cmd('get namespace');
    console.log(`found namespaces: ${nsList.toString()}`)
    if(nsList.toString().includes(ns)) {
      return
    }
    return this.kubectl.cmd(`create namespace ${ns}`);
  }
  _deploymentName(){
    return this.config.deploymentName || this.config.name;
  }
  _networkName(){
    return this.config.networkName || this.config.name;
  }
}

module.exports = {
  Helm
}
