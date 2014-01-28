var cclog = require('cclog');
var homegroup = require('./homegroup');
var userdao = require('./userdao');
var ONE_DAY = 24 * 3600 * 1000;
var redis;
exports.init = function(redisClient) {
    redis = redisClient;
}
// id:topic
// all:topics
// u:{uid}:t   user create topics
// u:{uid}:rt  user replied topics
// g:{gid}:t   all topics in a group sort by a summary value
// t:{tid}       hash info of topic, hincr tid's reply id
// r:{tid}-{rid}
// t:{tid}:rv   all replies of topic, sort with rank score.

// Topic
exports.create = function create(info, callback) {
    var uid = info.uid;
    if(!info.gid) delete info.gid;

    userdao.assertExistsUser(uid, function(err) {
            if(err) {return callback(err);}
            redis.generate('t', function(err, id, key) {
                    if(err) return callback(err);
                    info.id = id;
                    info.create = Date.now();
                    // TODO save text into leveldb
                    var multi = redis.multi()
                      .hmset(key, info)
                      .sadd('all:topics', id)
                      .rpush('u:'+uid+':t', id) // a list
                    if(info.gid) {
                      multi = multi.zadd('g:'+info.gid+':t', Date.now(), id) // initial score with publish date.
                    }
                    multi.exec(function(err, results) {
                            if(err) return callback(err);
                            cclog('USER', uid, 'CREATE_TOPIC', JSON.stringify(info), 'GROUP', info.gid);
                            callback(null, info);
                            homegroup.notifyTopic(info, cclog.ifError);
                            // TODO send notification to all users in that groups.
                    });
            });
    });
}

exports.get = function get(id, callback) {
    redis.hgetall('t:' + id, callback);
}

exports.getDetail = function getDetail(id, callback) {
    redis.hgetall('t:' + id, function(err, topic) {
            if(err) {return callback(err);}
            redis.multi()
              .hgetall('g:' + topic.gid)
              .hgetall('u:' + topic.uid)
              .exec(function(err, results) {
                  if(err) return callback(err);
                  exports.getComments(id, 0, 20, function(err, comments) {
                      if(err) return callback(err);
                      topic.group = results[0];
                      topic.author = results[1];
                      topic.comments = comments;
                      callback(err, topic);
                  })
              });
    })
}

// End Topic
// ==================================================
// Reply

exports.createComment = function createComment(info, callback) {
    var uid = info.uid; // can be null
    var tid = info.tid;
    redis.hincrby('t:' + tid, 'replies', 1, function(err, rid) {
            if(err) {return callback(err);}
            info.rid = rid;
            var now = info.create = Date.now();
            var id = tid + '-' + rid;
            redis.multi()
              .hmset('r:' + id, info)
              .sadd('u:' + uid + ':rt', tid)
              .zadd('t:' + tid + ':r', now, rid)
              // one day == one word
              // a* time + b * length + c * score
              // .zadd('t:' + tid + ':rv', (now / ONE_DAY) + Math.log(info.txt.length), rid)
              .exec(function(err, data) {
                      if(err) {return callback(err);}
                      callback(null, info);
              })

    })
}

exports.getComments = function getComments(tid, start, end, callback) {
    redis.zrange_map('t:'+tid+':r', start, end, function(rid, emit) {
            exports.getComment(tid, rid, emit);
    }, callback)
}

exports.getComment = function getComment(tid, rid, callback) {
    redis.hgetall('r:' + tid + '-' + rid, function(err, data) {
            if(err) {return callback(err);}
            redis.hgetall('u:' + data.uid, function(err, user) {
                    if(err) return callback(err);
                    data.user = user;
                    callback(null, data)
            })
    })
}
