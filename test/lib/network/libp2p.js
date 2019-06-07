const subject = require('../../../lib/network/libp2p');

require('chai')
  .should()


describe('libp2p', () => {
  describe('createNodeKeys', () => {
    const nodes = 3;
    let result;

    beforeEach(async () => {
      result = await subject.createNodeKeys(nodes);
    });

    it('should return one element per node', () => {
      result.length.should.eq(nodes);
    });

    it('each element should have a nodeKey and peerId', () => {
      result.forEach((item) => {
        item.nodeKey.should.not.be.null;
        item.nodeKey.length.should.eq(64);
        item.peerId.should.not.be.null;
      })
    });

    it('two consecutive calls should return different values', async () => {
      const result2 = await subject.createNodeKeys(nodes);

      for (const n of Array(nodes).keys()) {
        (result[n].nodeKey === result2[n].nodeKey).should.not.be.true;
        (result[n].peerId === result2[n].peerId).should.not.be.true;
      }
    });
  });
});
