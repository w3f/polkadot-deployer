module.exports = {
  default: (config, clusterIndex=0) => {
    return `${config.name}.${config.remote.clusters[clusterIndex].domain}`;
  },
  telemetry: (deploymentName, dom) => {
    return `wss://telemetry-backend.${deploymentName}-0.${dom}`;
  }
}
