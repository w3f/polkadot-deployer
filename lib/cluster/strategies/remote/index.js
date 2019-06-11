const { ApiPromise, WsProvider } = require('@polkadot/api');
const path = require('path');

const cmd = require('../../../core/cmd');
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
    for (let counter = 0; counter < this.config.remote.clusters.length; counter++) {
      const name = this._clusterName(counter);
      const workers = partition[counter];
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
        await this.kubectl[counter].deleteVolumeClaims();

        await this._cmd('init', counter);
          resolve(this._cmd('destroy -auto-approve', counter));
      }));
    }
    return Promise.all(deletionPromises);
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
    const name = this._clusterName(index);

    files.copyTerraformFiles(name, this.config.type);

    const terraformTplPath = files.terraformTplPath(this.config.type);
    const terraformPath = files.terraformPath(name);
    ['provider.tf', 'variables.tf'].forEach((item) => {
      const origin = path.join(terraformTplPath, item);
      const target = path.join(terraformPath, item);
      tpl.create(origin, target, this.config.remote.clusters[index]);
    })
  }

  async _cmd(command, index, options = {}) {
    const actualOptions = Object.assign({}, this.options[index], options)
    return await cmd.exec(`./terraform ${command}`, actualOptions);
  }

  _clusterName(index) {
    return `${this.config.name}-${index}`;
  }

  _domain(index) {
    const name = this._clusterName(index);

    return `${name}.${this.config.remote.clusters[index].domain}`;
  }

  _wsEndpoint(index) {
    const domain = this._domain(index);

    return `wss://${domain}`;
  }

  _p2pDomain(index) {
    const domain = this._domain(index);

    return `p2p.${domain}`;
  }

  _bootNodes() {
    /*
    if (nodeIndex !== 0 && this.config.remote.clusters.length % nodeIndex !== 0) {
      // regular node, points to the local main node.
      // first, determine the peerId of the bootnode of the cluster to which this node belongs.
      const peerId = this._bootNodePeerId(nodeIndex);
      return `/dns4/polkadot-node-0/tcp/30333/p2p/${peerId}`;
    }
    */

    const output = [];
    const nodesPerCluster = nodes.perCluster(this.config);

    for (let counter = 0; counter < this.config.remote.clusters.length; counter++) {
      // determine domain and peerId
      const p2pDomain = this._p2pDomain(counter);
      const bootNodeIndex = counter * nodesPerCluster;
      const peerId = this.config.nodeKeys[bootNodeIndex].peerId;
      output.push(`/dns4/${p2pDomain}/tcp/30333/p2p/${peerId}`);
    }
    shuffle(output);
    return output;
  }

  _bootNodePeerId(nodeIndex) {
    const nodesPerCluster = nodes.perCluster(this.config);
    const clusterIndex = Math.floor(nodeIndex / nodesPerCluster) * nodesPerCluster;
    return this.config.nodeKeys[clusterIndex].peerId;
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
