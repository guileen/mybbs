var async = require('async');
var cclog = require('cclog');
var helper = require('./helper');
var redis;

exports.init = function(redisClient) {
    redis = redisClient;
}

exports.searchGroup = function(gname, callback){
  // TODO find by group names.
  redis.hgetall('g:' + gname, function(err, result) {
      if(err) return callback(err);
      if(result) return callback(null, [result]);
      else callback(null, []);
  });
}
