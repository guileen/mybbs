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
