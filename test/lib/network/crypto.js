const ospath = require('ospath');
const sinon = require('sinon');
const tmp = require('tmp');

const subject = require('../../../lib/network/crypto');

require('chai')
  .should()


describe('keys', () => {
  let sandbox;
  const nodes = 3;

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

  describe('create', () => {
    it('should return the created keys', async () => {
      const output = await subject.create(nodes);

      const types = subject.keyTypes();

      types.forEach((type) => {
        output[type].length.should.eq(nodes);

        output[type].forEach((keyItem) => {
          keyItem.address.should.not.be.null;
          keyItem.seed.should.not.be.null;
          keyItem.mnemonic.should.not.be.null;
        });
      });
    });
  });
});
