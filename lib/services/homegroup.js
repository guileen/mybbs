var async = require('async');
var qh = require('qh');
var cclog = require('cclog');
var helper = require('./helper');
var redis;
// hg:uid  homegroup   zset  timescore, gid
// hgt:uid:gid  homegroup topics
// hg:uid:ug-msg

exports.setRedisClient = function(redisClient) {
    redis = redisClient;
}

// user join to group
exports.joinGroup = function(uid, gid) {
    redis.zadd('hg:'+uid, Date.now(), gid);
}

exports.newTopic = function(topic, callback) {
    var gid = topic.gid;
    var createTime = topic.create;
    // for every user follow the groups, update that user's homegroup
    redis.smembers('g:'+gid+':u', function(err, members) {
            async.eachLimit(members, 100, function(member, callback) {
                    redis.zadd('hg:'+member, createTime, gid, callback);
            }, callback);
    })
    // redis.hget('g:'+gid, 'hgscore', function(err, hgscore) {
    //         if(err) return callback(err);
    //         var hgscore = createTime - ((createTime - hgscore) / 2);
    //         redis.hset('g:'+gid, 'hgscore', hgscore, callback);
    // })
}

exports.getHomeGroup = function(uid, callback) {
    redis.zrange_map('hg:' + uid, 0, -1, function iterator(gid, emit) {
            async.parallel([
                    redis.hgetall.bind(redis, 'g:'+gid)
                  , exports.getGroupTopics.bind(null, gid, 0, 3)
            ], emit);
    }, callback);
}

exports.getGroupTopics = function(gid, start, end, callback) {
    redis.zrange_map('g:'+gid+':t', start, end, function iterator(tid, emit) {
            redis.hgetall('t:' + tid, emit);
    }, callback);
}
