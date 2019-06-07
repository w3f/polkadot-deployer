const { ApiPromise, WsProvider } = require('@polkadot/api');
const path = require('path');

const cmd = require('../../../core/cmd');
const files = require('../../../core/files');
const { Helm } = require('../../../clients/helm');
const { Kubectl } = require('../../../clients/kubectl');
const nodes = require('../../../network/nodes');
const tpl = require('../../../tpl');


class RemoteCluster {
  constructor(config) {
    this.config = JSON.parse(JSON.stringify(config));
    this.options = [];
    this.helm = [];
    this.kubectl = [];

    for (let counter = 0; counter < this.config.remote.clusters.length; counter++) {
      const name = this._clusterName(counter);
      this._initializeTerraform(counter);

      this.options.push({
        cwd: files.terraformPath(name),
        verbose: config.verbose
      });

      config.name = name;
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
    const deletionPromises = [];
    for (let counter = 0; counter < this.config.remote.clusters.length; counter++) {
      deletionPromises.push(() => {
        return new Promise(async (resolve) => {
          const name = this._clusterName(counter);
          try {
            await this.helm[counter].delete();
          } catch (e) {
            console.log(`Could not delete helm resources for ${name}: ${e.message}`);
          }
          await this.kubectl[counter].deleteVolumeClaims();

          await this._cmd('init', counter);
          resolve(this._cmd('destroy -auto-approve', counter));
        });
      });
    }
    return Promise.all(deletionPromises);
  }

  async waitReady(index=0) {
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
  }
  setNodeKeys(nodeKeys) {
    this.config.nodeKeys = nodeKeys;
  }

  async installNodes() {
    const nodesPerCluster = nodes.perCluster();
    const bootNodes = this._bootNodes();
    const installNodesPromise = []
    for (let counter = 0; counter < this.config.remote.clusters.length; counter++) {
      const startNode = counter * nodesPerCluster;
      let endNode = (counter + 1) * nodesPerCluster;
      if (counter == this.config.remote.clusters.length - 1) {
        endNode += this.config.nodes % this.config.remote.clusters.length;
      }

      this.helm[counter].setNodes(endNode - startNode);

      const keys = this.config.keys.slice(startNode, endNode);
      this.helm[counter].setKeys(keys);

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

    return `${name}.${this.config.remote.cluster[index].domain}`;
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

    for (let counter = 0; counter < this.config.remote.clusters.length; counter++) {
      // determine domain and peerId
      const p2pDomain = this._p2pDomain(counter);
      const nodesPerCluster = this._nodesPerCluster();
      const bootNodeIndex = counter * nodesPerCluster;
      const peerId = this.config.nodeKeys[bootNodeIndex].peerId;
      output.push(`/dns4/${p2pDomain}/tcp/30333/p2p/${peerId}`);
    }
    return output.join(',');
  }

  _bootNodePeerId(nodeIndex) {
    const nodesPerCluster = this._nodesPerCluster();
    const clusterIndex = Math.floor(nodeIndex / nodesPerCluster) * nodesPerCluster;
    return this.config.nodeKeys[clusterIndex].peerId;
  }
}

module.exports = {
  RemoteCluster
}
