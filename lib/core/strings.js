module.exports = {
  removeSpaces: (str) => {
    return str.trim().replace(/\s/g,'-');
  },
  removePathSpaces: (str) => {
    return str.trim().replace(/(\\\s+)/g,'').replace( /(\s+)/g, '');
  }
}
