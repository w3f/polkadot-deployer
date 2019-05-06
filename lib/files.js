const fs = require('fs');
const ospath = require('ospath');
const path = require('path');


module.exports = {
  dataPath: () => {
    return path.join(ospath.data(), 'polkadot-deployer');
  },
  componentsPath: () => {
    return path.join(module.exports.dataPath(), 'components');
  },
  directoryExists: (dirPath) => {
    try {
      return fs.statSync(dirPath).isDirectory();
    } catch (err) {
      return false;
    }
  },
  fileExists: (filePath) => {
    try {
      return fs.statSync(filePath).isFile();
    } catch (err) {
      return false;
    }
  },
  createDirectory: (dirPath) => {
    fs.mkdirSync(dirPath, {recursive: true});
  },
  readJSON: (filePath) => {
    const rawContent = fs.readFileSync(filePath);

    return JSON.parse(rawContent);
  }
};
