var async = require('async');
var RedisClient = require('redis').RedisClient;
var _redis = RedisClient.prototype;
var _slice = Array.prototype.slice;

_redis.mhgetall = function(keys, callback) {
    async.map(keys, _redis.hgetall.bind(this), callback);
}

// e.g.
// redis.smembers_map(key, iterator, callback);
// redis.zrange_map(key, start, end, iterator, callback);

;['sort', 'scan', 'hscan', 'sscan', 'zscan', 'mget', 'hkeys', 'hvals', 'lrange', 'sdiff', 'sinter', 'smembers', 'srandmember', 'sunion', 'zrange', 'zrangebyscore', 'zrevrange', 'zrevrangebyscore'].forEach(function(command) {
        _redis[command + '_map'] = function() {
            var args = _slice.call(arguments);
            var callback = args.pop();
            var iterator = args[args.length - 1];
            args[args.length - 1] = function(err, results) {
                if(err) return callback(err);
                async.map(results, iterator, callback);
            }
            _redis[command].apply(this, args);
        }
})

var _base36 = 'abcdefghijklmnopqrstuvwxyz0123456789';
var _base62 = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function genBase36Id(len) {
  var r = '', len = len || 7;
  for (var i = 0; i < len; i ++) {
    r += _base36[Math.floor(Math.random() * 36)];
  }
  return r;
}
function genBase62Id(len) {
  var r = '', len = len || 6;
  for (var i = 0; i < len; i ++) {
    r += _base62[Math.floor(Math.random() * 62)];
  }
  return r;
}

_redis.generate = function(prefix, callback) {
  var id = genBase62Id(6);
  var key = prefix + ':' + id;
  var self = this;
  this.exists(key, function(err, exist) {
      if(err) return callback(err);
      if(exist) {
        process.nextTick(self.generate(prefix, callback));
      } else {
        callback(err, id, key);
      }
  })
}
