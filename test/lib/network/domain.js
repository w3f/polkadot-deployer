const subject = require('../../../lib/network/domain');

require('chai')
  .should()

describe('domain', () => {
  describe('default', () => {
    it('should return the default domain for the given config and cluster index', () => {
      const expected = 'subdomain.domain.tld';
      const actual = subject.default('subdomain', 'domain.tld');

      actual.should.eq(expected);
    });
  });
  describe('telemetry', () => {
    it('should return the telemetry domain for the given config and cluster index', () => {
      const expected = 'wss://telemetry-backend.subdomain-0.domain.tld';
      const actual = subject.telemetry('subdomain', 'domain.tld');

      actual.should.eq(expected);
    });
  });
});
