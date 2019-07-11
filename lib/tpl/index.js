const fs = require('fs');
const Handlebars = require('handlebars');
const path = require('path');

const { Files } = require('../core/files');
const files = new Files();

Handlebars.registerHelper('raw', function(options) {
  return options.fn();
});

module.exports = {
  create: (source, target, data) => {
    const sourceTpl = fs.readFileSync(source).toString();
    const template = Handlebars.compile(sourceTpl);
    const contents = template(data);

    const targetDir = path.dirname(target);
    files.createDirectory(targetDir);

    fs.writeFileSync(target, contents);
  }
}
