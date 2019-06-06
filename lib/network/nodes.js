module.exports = {
  partition: (config) => {
    const numberOfClusters = config.remote.clusters.length;
    if (numberOfClusters === 0) {
      return [];
    }
    const elements = Math.floor(config.nodes / numberOfClusters);

    const output = new Array(numberOfClusters);
    for(let counter = 0; counter < numberOfClusters; counter++) {
      output[counter] = elements;
    }

    const remainder = config.nodes % numberOfClusters;
    output[numberOfClusters - 1] += remainder;

    return output;
  }
}
