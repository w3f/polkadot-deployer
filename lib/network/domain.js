module.exports = {
  default: (config, clusterIndex=0) => {
    return `${config.name}.${config.remote.clusters[clusterIndex].domain}`;
  }
}
