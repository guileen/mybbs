var crypto = require('crypto');

exports.merge = function(dest, src) {
  if (dest && src) {
    for(key in src) {
      dest[key] = src[key];
    }
  }
  return dest;
}

var md5 = exports.md5 = function(str, encoding) {
  encoding = encoding || 'hex';
  return crypto.createHash('md5').update(str).digest(encoding);
}

var secrets = exports.secrets = {

  random: function(length) {
    return md5(crypto.randomBytes(256)).substr(0, length);
  }

, crypt: function(src) {
    var salt = secrets.random(5)
    return salt + ':' + crypto.createHmac('sha256', salt).update(src).digest('base64');
  }

, equals: function(src, dest) {
      var parts = dest.split(':', 2); // [ salt:encoded ]
      return parts[1] == crypto.createHmac('sha256', parts[0]).update(src).digest('base64');
  }
}

exports.merge(exports, require('util'));
