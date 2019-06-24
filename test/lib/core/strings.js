const subject = require('../../../lib/core/strings');

require('chai')
  .should()


describe('strings', () => {
  describe('removeSpaces', () => {
    it('should replace inner spaces from input string with dashes', () => {
      const input = 'string with spaces';
      const expected = 'string-with-spaces';
      const actual = subject.removeSpaces(input);

      actual.should.eq(expected);
    });

    it('should remove leading spaces from input string', () => {
      const input = '   string-with-leading-spaces';
      const expected = 'string-with-leading-spaces';
      const actual = subject.removeSpaces(input);

      actual.should.eq(expected);
    });

    it('should remove trailing spaces from input string', () => {
      const input = 'string-with-trailing-spaces    ';
      const expected = 'string-with-trailing-spaces';
      const actual = subject.removeSpaces(input);

      actual.should.eq(expected);
    });
  });
});
