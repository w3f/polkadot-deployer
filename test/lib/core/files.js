const fs = require('fs-extra');
const ospath = require('ospath');
const path = require('path');
const sinon = require('sinon');
const tmp = require('tmp');

const strings = require('../../../lib/core/strings');
const { Files } = require('../../../lib/core/files')

const expectedOsPathPrefix = strings.removePathSpaces(ospath.data())

require('chai').should()


describe('Files', () => {
  before(() => {
    tmp.setGracefulCleanup();
  });

  describe('directoryExists', () => {
    it('returns true if the directory exists', () => {
      const tmpobj = tmp.dirSync();

      const subject = new Files();
      subject.directoryExists(tmpobj.name).should.be.true;
    });

    it('returns false if the directory does not exist', () => {
      const subject = new Files();
      subject.directoryExists('not_an_actual_directory').should.be.false;
    });

    it('returns false if the path is not a directory', () => {
      const tmpobj = tmp.fileSync();

      const subject = new Files();
      subject.directoryExists(tmpobj.name).should.be.false;
    });
  });

  describe('fileExists', () => {
    it('returns true if the file exists', () => {
      const tmpobj = tmp.fileSync();

      const subject = new Files();
      subject.fileExists(tmpobj.name).should.be.true;
    });

    it('returns false if the file does not exist', () => {
      const subject = new Files();
      subject.fileExists('not_an_actual_file').should.be.false;
    });

    it('returns false if the path is not a file', () => {
      const tmpobj = tmp.dirSync();

      const subject = new Files();
      subject.fileExists(tmpobj.name).should.be.false;
    });
  });

  describe('dataPath', () => {
    it('should return the data path', () => {
      const expected = path.join(expectedOsPathPrefix, 'polkadot-deployer');

      const subject = new Files();
      subject.dataPath().should.equal(expected);
    });
  });

  describe('componentsPath', () => {
    it('should return the components path', () => {
      const expected = path.join(expectedOsPathPrefix, 'polkadot-deployer', 'components');

      const subject = new Files();
      subject.componentsPath().should.equal(expected);
    });
  });

  describe('deploymentsPath', () => {
    it('should return the deployments path', () => {
      const expected = path.join(expectedOsPathPrefix, 'polkadot-deployer', 'deployments');

      const subject = new Files();
      subject.deploymentsPath().should.equal(expected);
    });
  });

  describe('deploymentsDBPath', () => {
    it('should return the deployments DB file path', () => {
      const expected = path.join(expectedOsPathPrefix, 'polkadot-deployer', 'deployments.db');

      const subject = new Files();
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
        const expected = path.join(expectedOsPathPrefix, 'polkadot-deployer', 'deployments', deploymentName);

        const subject = new Files();
        subject.deploymentPath(deploymentName).should.equal(expected);
      });
    });

    describe('kubeconfigPath', () => {
      it('should return the kubeconfig path for the given deployment', () => {
        const expected = path.join(expectedOsPathPrefix, 'polkadot-deployer', 'deployments', deploymentName, 'kubeconfig');

        const subject = new Files();
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

        const subject = new Files();
        subject.deleteKubeconfig(deploymentName);

        fs.existsSync(kubeconfigPath).should.throw;
      });
    });

    describe('copyTerraformFiles', () => {
      it('should throw for unknown remote types', () => {
        const subject = new Files();
        (() => subject.copyTerraformFiles(deploymentName, 'not-a-known-type')).should.throw;
      });

      it('should copy the files', () => {
        const tmpobj = tmp.dirSync();
        const dataPath = tmpobj.name;
        const st = sandbox.stub(ospath, 'data');
        st.returns(dataPath);

        const subject = new Files();

        const terraformBinSourcePath = subject.terraformBinPath();
        subject.createDirectory(path.dirname(terraformBinSourcePath));
        fs.closeSync(fs.openSync(terraformBinSourcePath, 'w'));

        const terraformPath = path.join(ospath.data(), 'polkadot-deployer', 'deployments', deploymentName, 'terraform');
        subject.copyTerraformFiles(deploymentName, 'gcp');

        fs.existsSync(terraformPath).should.be.true;

        const mainTfPath = path.join(terraformPath, 'main.tf');
        fs.existsSync(mainTfPath).should.be.true;

        const terraformBinTargetPath = path.join(terraformPath, 'terraform');
        fs.existsSync(terraformBinTargetPath).should.be.true;
      });
    });
    describe('copyChartTeplates', () => {
      it('should copy the charts template directory', async () => {
        const tmpobj = tmp.dirSync();
        const dataPath = tmpobj.name;
        const st = sandbox.stub(ospath, 'data');
        st.returns(dataPath);

        const subject = new Files();

        const templatesDirName = 'templates';
        const name = 'test';

        subject.copyChartTemplates(name);

        const valuesPath = subject.valuesPath(name);
        const expectedTemplatesDirPath = path.join(valuesPath, templatesDirName);

        fs.existsSync(expectedTemplatesDirPath).should.be.true;

        const actualFiles = await fs.readdir(expectedTemplatesDirPath);

        const origin = path.join(subject.projectConfigPath(), 'charts', templatesDirName)
        const expectedFiles = await fs.readdir(origin);

        actualFiles.length.should.be.equal(expectedFiles.length);

        actualFiles.forEach((file, index) => {
          file.should.equal(expectedFiles[index]);
        });
      });
    });
  });

  describe('readJSON', () => {
    it('should return a JSON from existing JSON files', () => {
      const tmpobj = tmp.fileSync();

      fs.writeFileSync(tmpobj.name, '{"field1": "value1", "field2": "value2"}');

      const subject = new Files();

      const result = subject.readJSON(tmpobj.name);

      result['field1'].should.equal('value1');
      result['field2'].should.equal('value2');
    });
  });

  describe('write', () => {
    it('should write the contents', () => {
      const tmpobj = tmp.fileSync();
      const content = 'mycontent';

      const subject = new Files();

      subject.write(tmpobj.name, content)

      const actual = fs.readFileSync(tmpobj.name).toString();

      actual.should.eq(content);
    });
  });
});
