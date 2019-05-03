const path = require('path');
const fs = require('fs');

module.exports = {
  show: () => {
    const targetPath = path.join(__dirname, '..', 'package.json');
    const rawContent = fs.readFileSync(targetPath);
    const pkg = JSON.parse(rawContent);

    return pkg.version;
  }
}
