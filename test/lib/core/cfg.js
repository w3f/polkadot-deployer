const fs = require('fs-extra');
const tmp = require('tmp');

const subject = require('../../../lib/core/cfg');

require('chai')
  .should();


describe('cfg', () => {
  describe('read', () => {
    const expected = `{"a":"b"}`;
    let tmpobj;
    let cfgPath;

    beforeEach(() => {
      tmpobj = tmp.fileSync();
      cfgPath = tmpobj.name;
    });

    it('returns the config data if permissions are ok', async () => {
      fs.writeFileSync(tmpobj.fd, expected);

      await fs.chmod(cfgPath, 0o600);

      const actual = subject.read(cfgPath);

      actual['a'].should.eq('b');
    });

    it('throws if permissions are not ok', async () => {
      fs.writeFileSync(tmpobj.fd, expected);

      await fs.chmod(cfgPath, 0o666);

      (() => {subject.read(cfgPath)}).should.throw();
    });
  });
});
