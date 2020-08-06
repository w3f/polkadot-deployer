module.exports = {
  removeSpaces: (str) => {
    return str.trim().replace(/\s/g,'-');
  },
  escapeMacosPathSpaces: (str) => {
    return str.trim().replace( /(\s+)/g, '' )
  }
}
