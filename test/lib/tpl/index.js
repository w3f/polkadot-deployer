const fs = require('fs');
const path = require('path');
const tmp = require('tmp');

const subject = require('../../../lib/tpl');

require('chai')
  .should()


describe('tpl', () => {
  before(() => {
    tmp.setGracefulCleanup();
  });

  describe('create', () => {
    it('should create a destination file from a template with interpolated data', () => {
      const tmpobj = tmp.dirSync();
      const template = 'blabla {{ key1 }} blabla {{ key2 }} bla ';
      const source = path.join(tmpobj.name, 'source');

      fs.writeFileSync(source, template);

      const target = path.join(tmpobj.name, 'target');
      const data = { key1: 'value1', key2: 'value2' };

      subject.create(source, target, data);

      const expected = 'blabla value1 blabla value2 bla ';
      const actual = fs.readFileSync(target).toString();

      actual.should.eq(expected);
    });
  });
});
