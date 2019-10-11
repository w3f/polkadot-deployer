module.exports = {
  partition: (config) => {
    const numberOfClusters = config.remote.clusters.length;
    if (numberOfClusters === 0) {
      return [];
    }
    const elements = module.exports.perCluster(config);

    const output = new Array(numberOfClusters);
    for(let counter = 0; counter < numberOfClusters; counter++) {
      output[counter] = elements;
    }

    const nodes = module.exports.maxNodes(config);
    const remainder = nodes % numberOfClusters;

    for(let counter = 0; counter < remainder; counter++) {
      output[counter] += 1;
    }

    return output;
  },
  perCluster: (config) => {
    const numberOfClusters = config.remote.clusters.length;
    const nodes = module.exports.maxNodes(config);
    if (numberOfClusters === 0) {
      return nodes;
    }
    return Math.floor(nodes / numberOfClusters);
  },
  maxNodes: (config) => {
    let nodes;
    if (!config.nodes) {
      nodes = config.sets[config.sets.length - 1];
    } else {
      nodes = config.nodes;
    }
    return nodes;
  }
}
