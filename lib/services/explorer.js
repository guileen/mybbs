var async = require('async');
var cclog = require('cclog');
var helper = require('./helper');
var common = require('../../common/common');
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

exports.randGroups = function randGroups(max, callback) {
  redis.srandmember_map('all:groups:' + common.PRIVACY_PUBLIC, max, function(gid, callback) {
      redis.hgetall('g:' + gid, callback);
  }, callback);
}
