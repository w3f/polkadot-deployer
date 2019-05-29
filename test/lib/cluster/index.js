const { Cluster } = require('../../../lib/cluster');
const { LocalCluster } = require('../../../lib/cluster/strategies/local');
const { RemoteCluster } = require('../../../lib/cluster/strategies/remote');

require('chai')
  .should()


describe('Cluster', () => {
  describe('#new', () => {
    const config = { field: 'value' };

    it('should create a new instance', () => {
      const cluster = new Cluster(config);

      cluster.should.be.a('Object');
    });

    it('should clone the received config', () => {
      const cluster = new Cluster(config);

      cluster.config.field.should.eq('value');

      (cluster.config === config).should.be.false;
    });

    it('should instantiate local strategy', () =>{
      const config = { type: 'local' };

      const cluster = new Cluster(config);

      (cluster.runner instanceof LocalCluster).should.be.true;
    });

    it('should instantiate remote strategy', () =>{
      const config = { type: 'gcp' };

      const cluster = new Cluster(config);

      (cluster.runner instanceof RemoteCluster).should.be.true;
    });

    it('should instantiate remote strategy by default', () =>{
      const config = { };

      const cluster = new Cluster(config);

      (cluster.runner instanceof RemoteCluster).should.be.true;
    });

  });
});
