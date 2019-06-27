const fs = require('fs-extra');
const ospath = require('ospath');
const path = require('path');
const sinon = require('sinon');
const tmp = require('tmp');

const { Cluster } = require('../../../lib/cluster');
const { Files } = require('../../../lib/core/files');
const { LocalCluster } = require('../../../lib/cluster/strategies/local');
const { RemoteCluster } = require('../../../lib/cluster/strategies/remote');

require('chai')
  .should()

const files = new Files();

describe('Cluster', () => {
  describe('#new', () => {
    const name = 'myname';
    const type = 'local';
    const config = { name, type };

    it('should require a type', () =>{
      const config = { name };

      (() => new Cluster(config)).should.throw;
    });
    it('should require a name', () =>{
      const config = { type };

      (() => new Cluster(config)).should.throw;
    });

    it('should create a new instance', () => {
      const cluster = new Cluster(config);

      cluster.should.be.a('Object');
    });

    it('should clone the received config', () => {
      const cluster = new Cluster(config);

      cluster.config.name.should.eq(name);

      (cluster.config === config).should.be.false;
    });

    it('should instantiate local strategy', () =>{
      const config = { name, type: 'local' };

      const cluster = new Cluster(config);

      (cluster.runner instanceof LocalCluster).should.be.true;
    });

    it('should instantiate remote strategy', () =>{
      const sandbox = sinon.createSandbox();
      const tmpobj = tmp.dirSync();
      const dataPath = tmpobj.name;
      const st = sandbox.stub(ospath, 'data');
      st.returns(dataPath);

      const terraformBinPath = files.terraformBinPath();
      files.createDirectory(path.dirname(terraformBinPath));
      fs.closeSync(fs.openSync(terraformBinPath, 'w'));

      const config = { name, type: 'gcp', remote: { clusters: []} };

      const cluster = new Cluster(config);

      sandbox.restore();
      (cluster.runner instanceof RemoteCluster).should.be.true;
    });
  });
});
