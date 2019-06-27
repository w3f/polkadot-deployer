const path = require('path');

const { Files } = require('./core/files');
const files = new Files();

module.exports = {
  show: () => {
    const targetPath = path.join(path.dirname(module.filename), '..', 'package.json');
    const pkg = files.readJSON(targetPath);

    return pkg.version;
  }
}
