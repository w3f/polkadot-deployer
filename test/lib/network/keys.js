const ospath = require('ospath');
const sinon = require('sinon');
const tmp = require('tmp');

const subject = require('../../../lib/network/keys');

require('chai')
  .should()


describe('keys', () => {
  let sandbox;
  const nodes = 3;
  const name = 'deployment1';
  const input = { nodes, name };

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

  describe('createAndSave', () => {
    it('should return the created keys', async () => {
      const output = await subject.createAndSave(input);

      output.stash.length.should.eq(nodes);
      output.controller.length.should.eq(nodes);
      output.session.length.should.eq(nodes);
    });
  });
});
