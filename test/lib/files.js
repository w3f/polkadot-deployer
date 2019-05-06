const subject = require('../../lib/files');

const fs = require('fs');
const ospath = require('ospath');
const path = require('path');
const tmp = require('tmp');

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
