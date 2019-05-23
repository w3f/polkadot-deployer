const ospath = require('ospath');
const sinon = require('sinon');
const tmp = require('tmp');

const subject = require('../../../lib/core/db');

require('chai')
  .should()


describe('db', () => {
  let sandbox;
  const name = 'someName';
  const allowed = 'allowedValue';
  const secretValue = 'secretValue'
  const data = { name, allowed, keys: secretValue };

  before(() => {
    tmp.setGracefulCleanup();
  });

  beforeEach(() => {
    const tmpobj = tmp.dirSync();
    const dataPath = tmpobj.name;

    sandbox = sinon.createSandbox();

    const st = sandbox.stub(ospath, 'data');
    st.returns(dataPath);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('save', () => {
    it('does not store the keys', async () => {
      await subject.save(data);

      const result = await subject.find(data);

      result.name.should.eq(name);
      result.allowed.should.eq(allowed);
      (result.keys === undefined).should.be.true;
    });
  });

  describe('update', () => {
    it('does not store the keys', async () => {
      await subject.save(data);
      data.keys = secretValue;
      await subject.update(data);

      const result = await subject.find(data);

      result.name.should.eq(name);
      result.allowed.should.eq(allowed);
      (result.keys === undefined).should.be.true;
    });
  });

});
