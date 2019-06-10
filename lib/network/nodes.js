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

    const nodes = _maxNodes(config);
    const remainder = nodes % numberOfClusters;
    output[numberOfClusters - 1] += remainder;

    console.log(`output: ${output}`)
    return output;
  },
  perCluster: (config) => {
    const numberOfClusters = config.remote.clusters.length;
    const nodes = _maxNodes(config);
    if (numberOfClusters === 0) {
      return nodes;
    }
    return Math.floor(nodes / numberOfClusters);
  },
}

function _maxNodes (config) {
  let nodes;
  if (!config.nodes) {
    nodes = config.sets[config.sets.length - 1];
  } else {
    nodes = config.nodes;
  }
  return nodes;
}
