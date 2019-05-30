const fs = require('fs');
const Handlebars = require('handlebars');


module.exports = {
  create: (source, target, data) => {
    const sourceTpl = fs.readFileSync(source).toString();
    const template = Handlebars.compile(sourceTpl);
    const contents = template(data);
    fs.writeFileSync(target, contents);
  }
}
