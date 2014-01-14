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
        var authorId = info.uid;
        if(!info.gid) delete info.gid;

        service.assertExistsUser(authorId, function(err) {
                if(err) {return callback(err);}
                redis.incr('id:topic', function(err, id) {
                        if(err) return callback(err);
                        info.id = id;
                        // TODO save text into leveldb
                        var multi = redis.multi()
                          .hmset('t:'+id, info)
                          .sadd('all:topics', id)
                          .rpush('u:'+authorId+':t', id) // a list
                        if(info.gid) {
                          multi = multi.zadd('g:'+info.gid+':t', id, Date.now()) // initial score with publish date.
                        }
                        multi.exec(function(err, results) {
                                if(err) return callback(err);
                                callback(null, info);
                        });
                        // TODO send notification to all users in that groups.
                });
        });
    }

    function get(id, callback) {
        redis.hgetall('t:' + id, callback);
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
    }
}
