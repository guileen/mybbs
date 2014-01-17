var async = require('async');
var qh = require('qh');
var cclog = require('cclog');
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
            console.log('====== members ', members);
            async.eachLimit(members, 100, function(member, callback) {
                    console.log('==========hg', member, createTime, gid);
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
    redis.zrange('hg:'+uid, 0, -1, function(err, groups) {
            // console.log('======groups', groups);
            qh.asyncMapHash(groups, function(gid, callback) {
                    exports.getGroupTopics(gid, 0, 3, callback);
            }, callback);
    })
}

exports.getGroupTopics = function(gid, start, end, callback) {
    redis.zrange('g:'+gid+':t', start, end, function(err, tids) {
            console.log('tids of gid', tids, gid, start, end);
            if(err) return callback(err);
            async.map(tids, exports.getTopic, cclog.intercept(callback))
    });
}

exports.getTopic = function(tid, callback) {
    redis.hgetall('t:' + tid, cclog.intercept('get topic of ' + tid, callback));
}


