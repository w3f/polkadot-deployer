const subject = require('../../../lib/network/libp2p');

require('chai')
  .should()


describe('libp2p', () => {
  describe('createNodeKeys', () => {
    const config = { nodes: 3 };
    let result;

    beforeEach(async () => {
      result = await subject.createNodeKeys(config);
    });

    it('should return only one element', () => {
      result.length.should.eq(1);
    });

    it('each element should have a nodeKey and peerId', () => {
      result[0].nodeKey.should.not.be.null;
      result[0].peerId.should.not.be.null;
    });

    it('two consecutive calls should return different values', async () => {
      const result2 = await subject.createNodeKeys(config);

      (result[0].nodeKey === result2[0].nodeKey).should.not.be.true;
      (result[0].peerId === result2[0].peerId).should.not.be.true;
    });
  });
});
