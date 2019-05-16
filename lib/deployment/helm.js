const cmd = require('../cmd');
const files = require('../files');
const keys = require ('../keys');


class Helm {
  constructor(config) {
    this.config = config;

    this.componentsPath = files.componentsPath()

    const kubeconfigPath = files.kubeconfigPath(config.name);

    this.options = {
      env: {
        KUBECONFIG: kubeconfigPath
      },
      cwd: this.componentsPath
    };
    this.tillerInitialized = false;
  }

  async redeploy() {
    this.tillerInitialized = true;
    await this.delete();
    await this.install();
  }

  async delete() {
    await this._ensureTiller();

    for (const n of Array(this.config.nodes).keys()) {
      const name = this._nodeName(n);
      await this.cmd(`delete ${name} --purge`);
    }
  }

  async install(){
    await this._ensureTiller();

    await this.cmd('repo add w3f https://w3f.github.io/helm-charts/');
    await this.cmd('repo update');

    const chartPath = 'w3f/polkadot-deployer';
    for (const n of Array(this.config.nodes).keys()) {
      const name = this._nodeName(n);

      const values = this._generateValuesFile(this.config.name, n);
      const valuesFilePath = files.valuesFilePath(this.config.name, n);
      files.writeYAML(valuesFilePath, values);

      await this.cmd(`install -n ${name} -f ${valuesFilePath} ${chartPath}`);
    }
  }

  async cmd(command) {
    await cmd.exec(`./helm ${command}`, this.options);
  }

  async _ensureTiller() {
    if (this.tillerInitialized) {
      return
    }
    await cmd.exec(`./kubectl -n kube-system create sa tiller`, this.options);
    await cmd.exec(`./kubectl create clusterrolebinding tiller --clusterrole cluster-admin --serviceaccount=kube-system:tiller`, this.options);

    await this.cmd(`init --service-account tiller --history-max=5`, this.options);

    const matcherOptions = Object.assign({ matcher: /tiller-deploy-.*\s*1\/1\s*Running/ }, this.options);
    await cmd.exec(
      `./kubectl get pods -l app=helm,name=tiller -n kube-system -w`,
      matcherOptions
    );
    this.tillerInitialized = true;
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
