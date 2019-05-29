const fs = require('fs-extra');
const ospath = require('ospath');
const path = require('path');
const sinon = require('sinon');
const tmp = require('tmp');

const subject = require('../../../lib/core/files');

require('chai').should()


describe('files', () => {
  before(() => {
    tmp.setGracefulCleanup();
  });

  describe('directoryExists', () => {
    it('returns true if the directory exists', () => {
      const tmpobj = tmp.dirSync();

      subject.directoryExists(tmpobj.name).should.be.true;
    });

    it('returns false if the directory does not exist', () => {
      subject.directoryExists('not_an_actual_directory').should.be.false;
    });

    it('returns false if the path is not a directory', () => {
      const tmpobj = tmp.fileSync();

      subject.directoryExists(tmpobj.name).should.be.false;
    });
  });

  describe('fileExists', () => {
    it('returns true if the file exists', () => {
      const tmpobj = tmp.fileSync();

      subject.fileExists(tmpobj.name).should.be.true;
    });

    it('returns false if the file does not exist', () => {
      subject.fileExists('not_an_actual_file').should.be.false;
    });

    it('returns false if the path is not a file', () => {
      const tmpobj = tmp.dirSync();

      subject.fileExists(tmpobj.name).should.be.false;
    });
  });

  describe('dataPath', () => {
    it('should return the data path', () => {
      const expected = path.join(ospath.data(), 'polkadot-deployer');

      subject.dataPath().should.equal(expected);
    });
  });

  describe('componentsPath', () => {
    it('should return the components path', () => {
      const expected = path.join(ospath.data(), 'polkadot-deployer', 'components');

      subject.componentsPath().should.equal(expected);
    });
  });

  describe('deploymentsPath', () => {
    it('should return the deployments path', () => {
      const expected = path.join(ospath.data(), 'polkadot-deployer', 'deployments');

      subject.deploymentsPath().should.equal(expected);
    });
  });

  describe('deploymentsDBPath', () => {
    it('should return the deployments DB file path', () => {
      const expected = path.join(ospath.data(), 'polkadot-deployer', 'deployments.db');

      subject.deploymentsDBPath().should.equal(expected);
    });
  });

  describe('functions that depend on deployment', () => {
    const deploymentName = 'myDeployment';

    let sandbox;

    beforeEach(() => {
      sandbox = sinon.createSandbox();
    });

    afterEach(() => {
      sandbox.restore();
    });

    describe('deploymentPath', () => {
      it('should return a deployment path by name', () => {

        const expected = path.join(ospath.data(), 'polkadot-deployer', 'deployments', deploymentName);

        subject.deploymentPath(deploymentName).should.equal(expected);
      });
    });

    describe('kubeconfigPath', () => {
      it('should return the kubeconfig path for the given deployment', () => {
        const expected = path.join(ospath.data(), 'polkadot-deployer', 'deployments', deploymentName, 'kubeconfig');

        subject.kubeconfigPath(deploymentName).should.equal(expected);
      });
    });

    describe('deleteKubeconfig', () => {
      it('should delete kubeconfig file', () => {
        const tmpobj = tmp.dirSync();
        const dataPath = tmpobj.name;
        const st = sandbox.stub(ospath, 'data');
        st.returns(dataPath);

        const kubeconfigPath = path.join(ospath.data(), 'polkadot-deployer', 'deployments', deploymentName, 'kubeconfig');
        const content = 'test';

        fs.mkdirSync(path.dirname(kubeconfigPath), { recursive: true });
        fs.writeFileSync(kubeconfigPath, content);

        subject.deleteKubeconfig(deploymentName);

        fs.existsSync(kubeconfigPath).should.throw;
      });
    });

    describe('copyTerraformFiles', () => {
      it('should throw for unknown remote types', () => {
        (() => subject.copyTerraformFiles(deploymentName, 'not-a-known-type')).should.throw;
      });

      it('should copy the files', () => {
        const tmpobj = tmp.dirSync();
        const dataPath = tmpobj.name;
        const st = sandbox.stub(ospath, 'data');
        st.returns(dataPath);

        const terraformPath = path.join(ospath.data(), 'polkadot-deployer', 'deployments', deploymentName, 'terraform');

        subject.copyTerraformFiles(deploymentName, 'gcp');

        fs.existsSync(terraformPath).should.be.true;

        const mainTfPath = path.join(terraformPath, 'main.tf');

        fs.existsSync(mainTfPath).should.be.true;
      });
    });
  });

  describe('readJSON', () => {
    it('should return a JSON from existing JSON files', () => {
      let tmpobj = tmp.fileSync();

      fs.writeFileSync(tmpobj.name, '{"field1": "value1", "field2": "value2"}');

      const result = subject.readJSON(tmpobj.name);

      result['field1'].should.equal('value1');
      result['field2'].should.equal('value2');
    });
  });
});
