const subject = require('../../../lib/core/strings');

require('chai')
  .should();

const stringWithLeadingSpaces = '   string-with-leading-spaces';
const stringWithTrailingSpaces = 'string-with-trailing-spaces    ';
const osPathWithSpaces = '/Users/user/Library/Application Support/polkadot-deployer/deployments/gcp-test-0/values/ingress-nginx.yaml';
const osPathWithEscapedSpaces = '/Users/user/Library/Application\\ Support/polkadot-deployer/deployments/gcp-test-0/values/ingress-nginx.yaml';
const osPathWithoutSpaces = '/Users/user/Library/ApplicationSupport/polkadot-deployer/deployments/gcp-test-0/values/ingress-nginx.yaml'

describe('strings', () => {
  describe('removeSpaces', () => {
    it('should replace inner spaces from input string with dashes', () => {
      const expected = "string-with-spaces";
      const actual = subject.removeSpaces("string with spaces");

      actual.should.eq(expected);
    });

    it('should remove leading spaces from input string', () => {
      const expected = stringWithLeadingSpaces.trim();
      const actual = subject.removeSpaces(stringWithLeadingSpaces);

      actual.should.eq(expected);
    });

    it('should remove trailing spaces from input string', () => {
      const expected = stringWithTrailingSpaces.trim();
      const actual = subject.removeSpaces(stringWithTrailingSpaces);

      actual.should.eq(expected);
    });

    it('should replace inner spaces from input string with empty spaces', () => {
      const expected = osPathWithoutSpaces;
      const actual = subject.removePathSpaces(osPathWithSpaces);

      actual.should.eq(expected);
    });

    it('should replace inner escaped spaces from input string with empty spaces', () => {
      const expected = osPathWithoutSpaces;
      const actual = subject.removePathSpaces(osPathWithEscapedSpaces);

      actual.should.eq(expected);
    });

    it('should remove leading spaces from input string', () => {
      const expected = stringWithLeadingSpaces.trim();
      const actual = subject.removePathSpaces(stringWithLeadingSpaces);

      actual.should.eq(expected);
    });

    it('should remove trailing spaces from input string', () => {
      const expected = stringWithTrailingSpaces.trim();
      const actual = subject.removePathSpaces(stringWithTrailingSpaces);

      actual.should.eq(expected);
    });

  });
});
