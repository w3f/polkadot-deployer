const portastic = require('portastic');

const cmd = require('../cmd');
const files = require('../files');


class Kubectl {
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
  }

  async portForward(podName, labels, targetPort, namespace='default') {
    let options = Object.assign({ matcher: new RegExp(`\\s*1\\/1`) }, this.options);
    await cmd.exec(
      `./kubectl get pods -l ${labels} -n ${namespace} -w`,
      options
    );
    const port = await portastic.find({min: 11000, max: 12000});
    options = Object.assign({
      detached: true,
      stdio: 'ignore'
    }, this.options);
    const pid = await cmd.exec(`./kubectl port-forward pods/${podName} ${port[0]}:${targetPort}`, options);

    return { pid, port: port[0] };
  }
}

module.exports = {
  Kubectl
}
