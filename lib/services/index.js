var util = require('../util');
var async = require('async');
var cclog = require('cclog');
var homegroup = require('./homegroup');
var explorer = require('./explorer');

module.exports = function(redis) {

    // id:group
    // id:user
    // id:topic
    // all:groups
    // all:users
    // all:topics
    // uname:{username}:id   get uid of a username
    // u:{uid}        hash info of user
    // u:{uid}:cg   user create groups
    // u:{uid}:jg   user joined groups
    // u:{uid}:t   user create topics
    // u:{uid}:rt  user replied topics
    // g:{gid}        hash info of group
    // g:{gid}:u    all users in a groups
    // g:{gid}:t   all topics in a group sort by a summary value
    // t:{tid}       hash info of topic, hincr tid's reply id
    // r:{tid}-{rid}
    //
    // t:{tid}:rv   all replies of topic, sort with rank score.
    // ---- // t:{tid}:r   all replies of topic, show with create order. from 1 to topic replies, no need this set.

    homegroup.setRedisClient(redis);
    explorer.init(redis);

    var pattern_username = /^[a-z0-9_-]{3,16}$/
      , pattern_nickname = /^[0-9a-zA-Z\u4e00-\u9fbf_-]{2,25}$/ // same as weibo
      , pattern_password = /^[a-z0-9_-]{6,18}$/
      , pattern_hexcolor = /^#?([a-f0-9]{6}|[a-f0-9]{3})$/
      , pattern_slug = /^[a-z0-9-]+$/
      , pattern_email = /^([a-z0-9_\+\.-]+)@([\da-z\.-]+)\.([a-z\.]{2,6})$/
      , pattern_url = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/
      , pattern_ip = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
      , pattern_htmltag = /^<([a-z]+)([^<]+)*(?:>(.*)<\/\1>|\s+\/>)$/ 
      ;


    // User
    function createUser(info, callback) {
        var email = info.email;
        // email check
        if(!pattern_email.test(email)) return callback(new Error('email is invalid to createUser'));
        var kEmailToId = 'email:' + email + ":id";
        redis.exists(kEmailToId, function(err, exists) {
                if(err) {return callback(err);}
                if(exists) {return callback(util.errcode('USEREXIST'))};
                redis.generate('u', 5, function(err, id, key) {
                        if(err) {return callback(err);}
                        info.id = id;
                        if(info.password) {
                          info.password = util.secrets.crypt(info.password);
                        }
                        redis.multi()
                          .hmset(key, info)
                          .sadd('all:users', id)
                          .set(kEmailToId, id)
                          .exec(function(err, results) {
                                  if(err) {return callback(err);}
                                  callback(null, info);
                          })
                })
        })
    }

    function getUser(uid, callback) {
        redis.hgetall('u:' + uid, function(err, info) {
                // TODO some data type cast. int, date, etc.
                callback(err, info);
        });
    }

    function getUserByEmail(email, callback) {
        redis.get('email:' + email + ':id', function(err, id) {
                console.log('id of', email, id);
                if(err) {return callback(err);}
                getUser(id, callback);
        })
    }

    function assertExistsUser(uid, callback) {
        if(!uid) return callback(new Error('user ' + uid + ' is null'));
        redis.exists('u:' + uid, function(err, exists) {
                if(err) {return callback(err);}
                if(!exists) return callback(new Error('user ' + uid + ' is not exists'));
                callback();
        })
    }

    // End User
    // =============================
    // Group

    function createGroup(info, callback) {
        var ownerId = info.owner;
        assertExistsUser(ownerId, function(err) {
                if(err) {return callback(err);}
                redis.generate32('g', 3, function(err, id, key) {
                        if(err) return callback(err);
                        info.id = id;
                        info.create = Date.now();
                        redis.multi()
                          .hmset(key, info)
                          .sadd('all:groups', id)
                          .sadd('u:'+ownerId+':cg', id)
                          .sadd('u:'+ownerId+':jg', id)
                          .sadd('g:'+id+':u', ownerId)
                          .exec(function(err, results) {
                                  if(err) return callback(err);
                                  callback(null, info);
                                  homegroup.joinGroup(ownerId, id, cclog.ifError);
                          });
                });
          })
    }

    function assertExistsGroup(gid, callback) {
        if(!gid) return callback(new Error('group ' + gid + ' is null'));
        redis.exists('g:'+ gid, function(err, exists) {
                if(err) {return callback(err);}
                if(!exists) return callback(new Error('group ' + gid + ' is not exists'));
                callback();
        })
    }

    function joinGroup(uid, gid, callback) {
        assertExistsUser(uid, function(err) {
                if(err) {return callback(err);}
                assertExistsGroup(gid, function(err) {
                        if(err) {return callback(err);}
                        redis.multi()
                          .sadd('u:'+uid+':jg', gid)
                          .sadd('g:'+gid+':u', uid)
                          .exec(function (err, results) {
                              // TODO send notification to all user in that groups
                              callback(err, results);
                              !err && homegroup.joinGroup(uid, gid, cclog.ifError);
                          });
                  });
          })
    }

    function getGroup(gid, callback) {
        redis.hgetall('g:' + gid, function(err, info) {
                if(err) {return callback(err);}
                // TODO data type cast, int, date, etc.
                callback(err, info);
        });
    }

    function getJoinedGroups(uid, callback) {
        redis.smembers('u:'+uid+':jg', function(err, gids) {
                if(err) {return callback(err);}
                async.map(gids, getGroup, callback);
        });
    }

    function getOwnedGroups(uid, callback) {
        redis.smembers('u:'+uid+':cg', function(err, gids) {
                if(err) {return callback(err);}
                async.map(gids, getGroup, callback);
        });
    }

    function getMembers(gid, cursor, count, callback) {
        // redis.sscan('g:' + gid + ':u', cursor, 'MATCH', '*',count, cclog.intercept('show get memebers', callback));
        redis.srandmember_map('g:' + gid + ':u', count, getUser, callback);
    }

    function assertUserInGroup(uid, gid, callback) {
        redis.sismember('g:' + gid + ':u', uid, function(err, yes) {
                if(err) {return callback(err);}
                if(!yes) {return callback(new Error('user ' + uid + ' is not in group ' + gid))}
                callback();
        });
    }

    function isMember(uid, gid, callback) {
      redis.sismember('g:' + gid + ':u', uid, callback);
    }

    // End Group

    var service = {
        // users
        createUser: createUser
      , getUser: getUser
      , getUserByEmail: getUserByEmail
      , assertExistsUser: assertExistsUser
        // groups
      , createGroup: createGroup
      , joinGroup: joinGroup
      , getGroup: getGroup
      , isMember: isMember
      , getJoinedGroups: getJoinedGroups
      , getOwnedGroups: getOwnedGroups
      , getMembers: getMembers
      , assertExistsGroup: assertExistsGroup
      , assertUserInGroup: assertUserInGroup
    };
    // topics
    service.topic = require('./topic')(redis, service)

    return service;

}
