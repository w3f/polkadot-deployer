const subject = require('../../../lib/network/domain');

require('chai')
  .should()

const input = {
  name: 'subdomain',
  remote: {
    clusters: [
      {
        domain: 'another-domain.com'
      },
      {
        domain: 'domain.tld'
      }
    ]
  }
};


describe('domain', () => {
  describe('default', () => {
    it('should return the default domain for the given config and cluster index', () => {
      const expected = 'subdomain.domain.tld';
      const actual = subject.default(input, 1);

      actual.should.eq(expected);
    });
    it('should return the default domain for the given config and 0 index if not specified', () => {
      const expected = 'subdomain.another-domain.com';
      const actual = subject.default(input);

      actual.should.eq(expected);
    });
  });
  describe('telemetry', () => {
    it('should return the telemetry domain for the given config and cluster index', () => {
      const expected = 'wss://telemetry-backend.subdomain.domain.tld';
      const actual = subject.telemetry(input, 1);

      actual.should.eq(expected);
    });
    it('should return the default domain for the given config and 0 index if not specified', () => {
      const expected = 'wss://telemetry-backend.subdomain.another-domain.com';
      const actual = subject.telemetry(input);

      actual.should.eq(expected);
    });
  });
});
