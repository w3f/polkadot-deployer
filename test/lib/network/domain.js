const subject = require('../../../lib/network/domain');

require('chai')
  .should()

describe('domain', () => {
  describe('default', () => {
    it('should return the default domain for the given name and config', () => {
      const expected = 'subdomain.domain.tld';
      const config = {clusters: [{domain: 'domain.tld'}]}
      const actual = subject.default('subdomain', config);

      actual.should.eq(expected);
    });
  });
  describe('telemetry', () => {
    it('should return the telemetry domain for the given config and cluster index', () => {
      const expected = 'wss://telemetry-backend.subdomain-0.domain.tld/submit';
      const config = {remote:{clusters: [{domain: 'domain.tld'}]}}
      const actual = subject.telemetrySubmitUrl('subdomain', config);

      actual.should.eq(expected);
    });
  });
  describe('base', () => {
    it('should return the domain defined at the cluster level specified by index', () => {
      const expected = 'domain.tld';
      const config = {clusters: [{domain: 'other-domain.tld'}, {domain: 'domain.tld'}]}
      const actual = subject.base(config, 1);

      actual.should.eq(expected);
    });
    it('should use cluster index 0 by default', () => {
      const expected = 'domain0.tld';
      const config = {clusters: [{domain: 'domain0.tld'}, {domain: 'domain1.tld'}]}
      const actual = subject.base(config);

      actual.should.eq(expected);
    });
    it('should use upper level domain if not defined at cluster level', () => {
      const expected = 'domain.tld';
      const config = {domain: 'domain.tld', clusters: [{field: 'value'}]}
      const actual = subject.base(config);

      actual.should.eq(expected);
    });
    it('should prefer domain defined at cluster level over upper level domain', () => {
      const expected = 'cluster-domain.tld';
      const config = {domain: 'upper-domain.tld', clusters: [{domain: 'cluster-domain.tld'}]}
      const actual = subject.base(config);

      actual.should.eq(expected);
    });

  });
});
