/*!
 * forward - lib/forward.js
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var fs = require('fs');
var crypto = require('crypto');
var mime = require('mime');

var md5 = function(str, encoding){
  return crypto
    .createHash('md5')
    .update(str, 'utf8')
    .digest(encoding || 'hex');
};

function readFile (file) {
  return function (done) {
    fs.readFile(file, done);
  };
}

/**
 * Foward the request to a special path.
 *
 * Options:
 *
 *   - `maxAge`  cache-control max-age directive, defaulting to 1 day
 *
 * Examples:
 *  var app = connect();
 *  app.use('/favicon.ico', forward(__dirname + '/assets/favicon.ico'));
 *  app.use('/humans.txt', forward(__dirname + '/assets/humans.txt', {charset: 'utf-8'}));
 *
 * @param {String} path
 * @param {Object} options
 * @return {Function}
 * @api public
 */

module.exports = function (path, options) {
  var cache = null;
  options = options || {};
  var maxAge = options.maxAge || 86400000;
  var contentType = options.mime || mime.lookup(path);
  var charset = options.charset ? '; charset=' + options.charset : '';

  return function* (next) {
    if (!cache) {
      try {
        var buf = yield readFile(path);
        cache = {
          headers: {
            'Content-Type': contentType + charset,
            'Content-Length': buf.length,
            'ETag': '"' + md5(buf) + '"',
            'Cache-Control': 'public, max-age=' + (maxAge / 1000)
          },
          body: buf
        };
      } catch (err) {
        err.status = 404;
        throw err;
      }
    }
    this.set(cache.headers);
    this.body = cache.body;
  };
};
