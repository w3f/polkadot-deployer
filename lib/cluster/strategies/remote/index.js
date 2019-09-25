const { ApiPromise, WsProvider } = require('@polkadot/api');
const path = require('path');

const cmd = require('../../../core/cmd');
const constants = require('../../../core/constants');
const cloud = require('../../../cloud');
const crypto = require('../../../network/crypto');
const domain = require('../../../network/domain');
const { Files } = require('../../../core/files');
const { Helm } = require('../../../clients/helm');
const { Kubectl } = require('../../../clients/kubectl');
const nameLib = require('../../../network/name');
const nodes = require('../../../network/nodes');
const portforward = require('../../../core/portforward');
const tpl = require('../../../tpl');


class RemoteCluster {
  constructor(config) {
    this.config = JSON.parse(JSON.stringify(config));
    this.files = new Files(config);
    this.options = [];
    this.helm = [];
    this.kubectl = [];
    this.credentials = cloud.credentials();

    const deploymentName = config.name;
    for (let counter = 0; counter < this.config.remote.clusters.length; counter++) {
      const name = nameLib.generate(this.config.name, counter);
      this._initializeTerraform(counter);

      this.options.push({
        cwd: this.files.terraformPath(name),
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
      const name = nameLib.generate(this.config.name, counter);
      // give one more worker for additional services, two for the first cluster (includes telemetry)
      let workers = partition[counter] + 1;
      if (counter === 0) {
        workers++;
      }
      creationPromises.push(new Promise(async (resolve) => {
        await this._cmd('init', counter);
        await this._cmd(`apply -auto-approve -var node_count=${workers} -var cluster_name=${name}`, counter);

        await this._saveKubeconfig(counter, name);
        resolve(true);
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

        const name = nameLib.generate(this.config.name, counter);
        try {
          await this.helm[counter].delete();
        } catch (e) {
          console.log(`Could not delete helm resources for ${name}: ${e.message}`);
        }
        try {
          await this.helm[counter].deleteDeps(counter);
        } catch (e) {
          console.log(`Could not delete helm dependencies ${name}: ${e.message}`);
        }

        try {
          await this.kubectl[counter].deleteVolumeClaims();
        } catch (e) {
          console.log(`Could not delete persistent volume claims for ${name}: ${e.message}`);
        }

        await this._cmd('init', counter);
        try {
          await this._cmd('destroy -auto-approve', counter);
        } catch (e) {
          console.log(`Could not destroy cluster: ${e.message}`);
        }
        resolve();
      }));
    }
    await Promise.all(deletionPromises.map(p => p.catch(e => console.log(`Could not delete clusters: ${e.message}`))));
    return this._destroyStateStore();
  }

  async waitReady(index) {
    if (this.config.benchmark) {
      return this._waitReadyPortForward();
    } else {
      return this._waitReadyDNS(index);
    }
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
    const installNodesPromise = [];
    const nonValidatorsPerCluster = this.config.nonValidatorIndices.length;
    for (let counter = 0; counter < this.config.remote.clusters.length; counter++) {
      const startNode = counter * nodesPerCluster;
      let endNode = (counter + 1) * nodesPerCluster;
      if (counter == this.config.remote.clusters.length - 1) {
        endNode += nodes.maxNodes(this.config) % this.config.remote.clusters.length;
      }

      this.helm[counter].setNodes(endNode - startNode);

      const startKeyIndex = counter * (nodesPerCluster - nonValidatorsPerCluster);
      const endKeyIndex = endNode - (counter + 1 ) * nonValidatorsPerCluster;


      const sessionTypes = crypto.sessionTypes();
      const sessionKeys = {};
      sessionTypes.forEach((type) => {
        sessionKeys[type] = this.config.keys[type].slice(startKeyIndex, endKeyIndex);
      });
      this.helm[counter].setSessionKeys(sessionKeys);

      const nodeKeys = this.config.nodeKeys.slice(startNode, endNode);
      this.helm[counter].setNodeKeys(nodeKeys);

      this.helm[counter].setBootNodes(bootNodes);

      const validatorBootnodes = this._validatorBootnodes(counter, nodesPerCluster, nonValidatorsPerCluster);
      this.helm[counter].setExtraBootnodes(validatorBootnodes);

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

  async getConfig() {
    const getConfigPromises = [];
    for (let counter = 0; counter < this.config.remote.clusters.length; counter++) {
      const name = nameLib.generate(this.config.name, counter);
      getConfigPromises.push(new Promise(async (resolve) => {
        await this._saveKubeconfig(counter, name);
        resolve(true);
      }));
    }
    return Promise.all(getConfigPromises);
  }

  _initializeTerraform(index) {
    const clusterName = nameLib.generate(this.config.name, index);
    const provider = this._getProvider(index);
    const projectID = this._getProjectID(index);

    this.files.copyTerraformFiles(clusterName, provider);

    const terraformTplPath = this.files.terraformTplPath(provider);
    const terraformPath = this.files.terraformPath(clusterName);
    ['main.tf', 'provider.tf', 'variables.tf', 'outputs.tf', 'backend.tf', 'remote-state/main.tf'].forEach((item) => {
      const origin = path.join(terraformTplPath, item);
      const target = path.join(terraformPath, item);
      const data = Object.assign(
        {},
        this.config.remote.clusters[index],
        {
          clusterName,
          projectID,
          deploymentName: this.config.name,
          credentials: this.credentials
        });
      tpl.create(origin, target, data);
    })
  }

  async _cmd(command, index, options = {}) {
    const actualOptions = Object.assign({}, this.options[index], options)
    const terraformPath = options.terraformPath || './';
    return cmd.exec(`${terraformPath}terraform ${command}`, actualOptions);
  }

  async _waitReadyPortForward() {
    const name = nameLib.generate(this.config.name, 0);

    const config = { name, verbose: this.config.verbose};

    return portforward.create(config);
  }

  async _waitReadyDNS(index=0) {
    const wsEndpoint = this._wsEndpoint(index);

    const provider = new WsProvider(wsEndpoint);
    const api = await new ApiPromise(provider);

    const [chain, nodeName, nodeVersion] = await Promise.all([
      api.rpc.system.chain(),
      api.rpc.system.name(),
      api.rpc.system.version()
    ]);

    console.log(`You are connected to chain ${chain} using ${nodeName} v${nodeVersion}`);

    api.disconnect();

    return { wsEndpoint };
  }

  _domain(index) {
    const name = nameLib.generate(this.config.name, index);
    return domain.default(name, this.config.remote, index);
  }

  _wsEndpoint(index) {
    const dom = this._domain(index);

    return `wss://${dom}`;
  }

  _p2pDomain(index) {
    const dom = this._domain(index);

    return `p2p.${dom}`;
  }

  _p2pVDomain(index) {
    const dom = this._domain(index);

    return `p2pv.${dom}`;
  }

  _bootNodes() {
    const output = [];
    const nodesPerCluster = nodes.perCluster(this.config);

    for (let counter = 0; counter < this.config.remote.clusters.length; counter++) {
      // one boot nodes per cluster, first one.
      const p2pDomain = this._p2pDomain(counter);
      const bootNodeIndex = counter * nodesPerCluster;
      const peerId = this.config.nodeKeys[bootNodeIndex].peerId;
      const port = constants.initialP2PPort;
      output.push(this._multiaddr(p2pDomain, port, peerId));
    }
    shuffle(output);
    return output;
  }

  _bootNodePeerId(nodeIndex) {
    const nodesPerCluster = nodes.perCluster(this.config);
    const clusterIndex = Math.floor(nodeIndex / nodesPerCluster) * nodesPerCluster;
    return this.config.nodeKeys[clusterIndex].peerId;
  }
  _multiaddr(domain, port, peerId) {
    return `/dns4/${domain}/tcp/${port}/p2p/${peerId}`
  }

  _stateStoreOptions() {
    const name = nameLib.generate(this.config.name, 0);
    const cwd = path.join(this.files.terraformPath(name), 'remote-state');
    const terraformPath = '../'
    return { cwd, terraformPath };
  }
  async _createStateStore() {
    const options = this._stateStoreOptions();

    await this._cmd('init', 0, options);
    try {
      await this._cmd(`apply -auto-approve`, 0, options);
    } catch (e) {
      // on CI it is ok to fail bc the state store is already created.
      console.log(`could not create state store: ${e.message}`);
    }
  }

  async _destroyStateStore() {
    const options = this._stateStoreOptions();

    await this._cmd('init', 0, options);
    return this._cmd(`destroy -auto-approve`, 0, options);
  }

  _getProjectID(index) {
    return this.config.remote.clusters[index].projectID || this.config.remote.projectID || "";
  }

  _getProvider(index) {
    return this.config.remote.clusters[index].provider || this.config.type;
  }

  _validatorBootnodes(clusterIndex, nodesPerCluster, nonValidatorsPerCluster) {
    const validatorBootnodeCfg = this.config.remote.clusters[clusterIndex].validatorBootnode;
    if (!validatorBootnodeCfg) {
      return [];
    }

    const domain = this._p2pVDomain(validatorBootnodeCfg.clusterIndex);

    const port = constants.initialP2PPort + nonValidatorsPerCluster;

    const validatorNodeIndex = validatorBootnodeCfg.clusterIndex * nodesPerCluster + nonValidatorsPerCluster;
    const peerId = this.config.nodeKeys[validatorNodeIndex].peerId;

    const validatorBootnode = this._multiaddr(domain, port, peerId);

    return [validatorBootnode];
  }

  async _saveKubeconfig(counter, name) {
    const kubeconfigContent = await this._cmd('output kubeconfig', counter, {verbose: false});
    const targetKubeconfigPath = this.files.kubeconfigPath(name);
    this.files.write(targetKubeconfigPath, kubeconfigContent);
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
