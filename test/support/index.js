/* jshint undef: false, unused: false */

var resolve          = require('path').resolve

exports.fixp = function (filename) {
  return resolve(__dirname, '../fixtures', filename);
}
