const { ApiPromise, WsProvider } = require('@polkadot/api');
const path = require('path');

const cmd = require('../../../core/cmd');
const constants = require('../../../core/constants');
const domain = require('../../../network/domain');
const files = require('../../../core/files');
const { Helm } = require('../../../clients/helm');
const { Kubectl } = require('../../../clients/kubectl');
const nodes = require('../../../network/nodes');
const portforward = require('../../../core/portforward');
const tpl = require('../../../tpl');


class RemoteCluster {
  constructor(config) {
    this.config = JSON.parse(JSON.stringify(config));
    this.options = [];
    this.helm = [];
    this.kubectl = [];

    const deploymentName = config.name;
    for (let counter = 0; counter < this.config.remote.clusters.length; counter++) {
      const name = this._clusterName(counter);
      this._initializeTerraform(counter);

      this.options.push({
        cwd: files.terraformPath(name),
        verbose: config.verbose
      });

      config.name = name;
      config.deploymentName = deploymentName;
      this.helm.push(new Helm(config));
      this.kubectl.push(new Kubectl(config));
    }
  }

  async create() {
    const creationPromises = [];
    const partition = nodes.partition(this.config);
    await this._createStateStore();
    for (let counter = 0; counter < this.config.remote.clusters.length; counter++) {
      const name = this._clusterName(counter);
      // give one more worker for additional services, two for the first cluster (includes telemetry)
      let workers = partition[counter] + 1;
      if (counter === 0) {
        workers++;
      }
      creationPromises.push(new Promise(async (resolve) => {
        await this._cmd('init', counter);
        await this._cmd(`apply -auto-approve -var node_count=${workers} -var cluster_name=${name}`, counter);

        const kubeconfigContent = await this._cmd('output kubeconfig', counter, {verbose: false});
        const targetKubeconfigPath = files.kubeconfigPath(name);
        resolve(files.write(targetKubeconfigPath, kubeconfigContent));
      }));
    }
    return Promise.all(creationPromises);
  }

  async destroy() {
    const nodesPerCluster = nodes.perCluster(this.config);
    const deletionPromises = [];
    for (let counter = 0; counter < this.config.remote.clusters.length; counter++) {
      deletionPromises.push(new Promise(async (resolve) => {
        const startNode = counter * nodesPerCluster;
        let endNode = (counter + 1) * nodesPerCluster;
        if (counter == this.config.remote.clusters.length - 1) {
          endNode += nodes.maxNodes(this.config) % this.config.remote.clusters.length;
        }
        this.helm[counter].setNodes(endNode - startNode);

        const name = this._clusterName(counter);
        try {
          await this.helm[counter].delete();
        } catch (e) {
          console.log(`Could not delete helm resources for ${name}: ${e.message}`);
        }
        try {
          await this.kubectl[counter].deleteVolumeClaims();
        } catch (e) {
          console.log(`Could not delete persistent volume claims for ${name}: ${e.message}`);
        }

        await this._cmd('init', counter);
        resolve(this._cmd('destroy -auto-approve', counter));
      }));
    }
    await Promise.all(deletionPromises);
    return this._destroyStateStore();
  }

  async waitReady(index) {
    if (this.config.benchmark) {
      return this._waitReadyPortForward();
    } else {
      return this._waitReadyDNS(index);
    }
  }

  async _waitReadyPortForward() {
    const name = this._clusterName(0);

    const config = { name, verbose: this.config.verbose};

    return portforward.create(config);
  }

  async _waitReadyDNS(index=0) {
    const wsEndpoint = this._wsEndpoint(index);

    const provider = new WsProvider(wsEndpoint);
    const api = await new ApiPromise(provider).isReady;

    api.disconnect();

    return { wsEndpoint };
  }

  setNodes(nodes) {
    this.config.nodes = nodes;
  }
  setKeys(keys) {
    this.config.keys = keys;
    for (let counter = 0; counter < this.helm.length; counter++) {
      this.helm[counter].setKeys(keys);
    }
  }
  setNodeKeys(nodeKeys) {
    this.config.nodeKeys = nodeKeys;
  }

  async installNodes() {
    const nodesPerCluster = nodes.perCluster(this.config);
    const bootNodes = this._bootNodes();
    const installNodesPromise = []
    for (let counter = 0; counter < this.config.remote.clusters.length; counter++) {
      const startNode = counter * nodesPerCluster;
      let endNode = (counter + 1) * nodesPerCluster;
      if (counter == this.config.remote.clusters.length - 1) {
        endNode += nodes.maxNodes(this.config) % this.config.remote.clusters.length;
      }

      this.helm[counter].setNodes(endNode - startNode);

      const sessionKeys = this.config.keys['session'].slice(startNode, endNode);
      this.helm[counter].setSessionKeys(sessionKeys);

      const nodeKeys = this.config.nodeKeys.slice(startNode, endNode);
      this.helm[counter].setNodeKeys(nodeKeys);

      this.helm[counter].setBootNodes(bootNodes);

      installNodesPromise.push(this.helm[counter].install());
    }
    return Promise.all(installNodesPromise);
  }

  async installDeps() {
    const installDepsPromise = []
    for (let counter = 0; counter < this.config.remote.clusters.length; counter++) {
      installDepsPromise.push(this.helm[counter].installDeps(counter));
    }
    return Promise.all(installDepsPromise);
  }

  async deleteNodes() {
    const deleteNodesPromise = []
    for (let counter = 0; counter < this.config.remote.clusters.length; counter++) {
      deleteNodesPromise.push(this.helm[counter].delete());
    }
    return Promise.all(deleteNodesPromise);
  }

  _initializeTerraform(index) {
    const clusterName = this._clusterName(index);

    files.copyTerraformFiles(clusterName, this.config.type);

    const terraformTplPath = files.terraformTplPath(this.config.type);
    const terraformPath = files.terraformPath(clusterName);
    ['provider.tf', 'variables.tf', 'backend.tf', 'remote-state/main.tf'].forEach((item) => {
      const origin = path.join(terraformTplPath, item);
      const target = path.join(terraformPath, item);
      const data = Object.assign(
        {},
        this.config.remote.clusters[index],
        {
          clusterName,
          deploymentName: this.config.name
        });
      tpl.create(origin, target, data);
    })
  }

  async _cmd(command, index, options = {}) {
    const actualOptions = Object.assign({}, this.options[index], options)
    const terraformPath = options.terraformPath || './';
    return await cmd.exec(`${terraformPath}terraform ${command}`, actualOptions);
  }

  _clusterName(index) {
    return `${this.config.name}-${index}`;
  }

  _domain(index) {
    const name = this._clusterName(index);
    return domain.default(name, this.config.remote.clusters[index].domain);
  }

  _wsEndpoint(index) {
    const dom = this._domain(index);

    return `wss://${dom}`;
  }

  _p2pDomain(index) {
    const dom = this._domain(index);

    return `p2p.${dom}`;
  }

  _bootNodes() {
    const output = [];
    const nodesPerCluster = nodes.perCluster(this.config);

    for (let counter = 0; counter < this.config.remote.clusters.length; counter++) {
      // two boot nodes per cluster, the first two ones
      const p2pDomain = this._p2pDomain(counter);
      const bootNodeIndex = counter * nodesPerCluster;
      let peerId = this.config.nodeKeys[bootNodeIndex].peerId;
      let port = constants.initialP2PPort;
      output.push(this._mutiaddr(p2pDomain, port, peerId));
    }
    shuffle(output);
    return output;
  }

  _bootNodePeerId(nodeIndex) {
    const nodesPerCluster = nodes.perCluster(this.config);
    const clusterIndex = Math.floor(nodeIndex / nodesPerCluster) * nodesPerCluster;
    return this.config.nodeKeys[clusterIndex].peerId;
  }
  _mutiaddr(domain, port, peerId) {
    return `/dns4/${domain}/tcp/${port}/p2p/${peerId}`
  }

  _stateStoreOptions() {
    const name = this._clusterName(0);
    const cwd = path.join(files.terraformPath(name), 'remote-state');
    const terraformPath = '../'
    return { cwd, terraformPath };
  }
  async _createStateStore() {
    const options = this._stateStoreOptions();

    await this._cmd('init', 0, options);
    await this._cmd(`apply -auto-approve`, 0, options);
  }

  async _destroyStateStore() {
    const options = this._stateStoreOptions();

    await this._cmd('init', 0, options);
    await this._cmd(`destroy -auto-approve`, 0, options);
  }
}

module.exports = {
  RemoteCluster
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
