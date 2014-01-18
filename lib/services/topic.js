var cclog = require('cclog');
var homegroup = require('./homegroup');
module.exports = function(redis, service) {
    // id:topic
    // all:topics
    // u:{uid}:t   user create topics
    // u:{uid}:rt  user replied topics
    // g:{gid}:t   all topics in a group sort by a summary value
    // t:{tid}       hash info of topic, hincr tid's reply id
    // r:{tid}-{rid}
    // t:{tid}:rv   all replies of topic, sort with rank score.

    // Topic
    function create(info, callback) {
        var uid = info.uid;
        if(!info.gid) delete info.gid;

        service.assertExistsUser(uid, function(err) {
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

    function get(id, callback) {
        redis.hgetall('t:' + id, callback);
    }

    function getDetail(id, callback) {
        redis.hgetall('t:' + id, function(err, topic) {
                if(err) {return callback(err);}
                redis.multi()
                  .hgetall('g:' + topic.gid)
                  .hgetall('u:' + topic.uid)
                  .exec(function(err, results) {
                          if(err) return callback(err);
                          topic.group = results[0];
                          topic.author = results[1];
                          callback(err, topic);
                  });
        })
    }

    function notifyNewTopicToMembers(topic, callback) {
        var groupId = topic.gid;
        // TODO use lua
        redis.notify_topic();
    }

    // End Topic
    // ==================================================
    return {
      create: create
    , get: get
    , getDetail: getDetail
    }
}
