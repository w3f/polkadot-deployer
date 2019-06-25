module.exports = {
  default: (config, clusterIndex=0) => {
    return `${config.name}.${config.remote.clusters[clusterIndex].domain}`;
  },
  telemetry: (config, clusterIndex=0) => {
    const dom = module.exports.default(config, clusterIndex);

    return `wss://telemetry-backend.${dom}`;
  }
}
