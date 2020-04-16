const fs = require('fs-extra');
const tmp = require('tmp');

const subject = require('../../../lib/core/cfg');

require('chai')
  .should();


describe('cfg', () => {

  beforeEach(() => {

  });

  describe('read', () => {
    it('returns the config data if permissions are ok', async () => {
      const tmpobj = tmp.fileSync();
      const cfgPath = tmpobj.name;
      const expected = `{"a":"b"}`;

      fs.writeFileSync(tmpobj.fd, expected);

      fs.chmod(cfgPath, 0o600);

      const actual = subject.read(cfgPath);

      actual['a'].should.eq('b');
    });

    it('throws if permissions are not ok');
  });
});
