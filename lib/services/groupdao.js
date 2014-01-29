var util = require('../util');
var async = require('async');
var cclog = require('cclog');
var homegroup = require('./homegroup');
var explorer = require('./explorer');
var userdao = require('./userdao');
var topicdao = require('./topicdao');
var redis;

exports.init = function(redisClient) {
    redis = redisClient;
}

    // keys about group and, group user relation.
    // id:group
    // all:groups
    // u:{uid}:cg   user create groups
    // u:{uid}:jg   user joined groups
    // g:{gid}        hash info of group
    // g:{gid}:u    all users in a groups

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


    // Group

    exports.createGroup = function createGroup(info, callback) {
        var ownerId = info.owner;
        userdao.assertExistsUser(ownerId, function(err) {
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

    exports.assertExistsGroup = function assertExistsGroup(gid, callback) {
        if(!gid) return callback(new Error('group ' + gid + ' is null'));
        redis.exists('g:'+ gid, function(err, exists) {
                if(err) {return callback(err);}
                if(!exists) return callback(new Error('group ' + gid + ' is not exists'));
                callback();
        })
    }

    exports.joinGroup = function joinGroup(uid, gid, callback) {
        userdao.assertExistsUser(uid, function(err) {
                if(err) {return callback(err);}
                exports.assertExistsGroup(gid, function(err) {
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

    exports.getGroup = function getGroup(gid, callback) {
        redis.hgetall('g:' + gid, function(err, info) {
                if(err) {return callback(err);}
                // TODO data type cast, int, date, etc.
                callback(err, info);
        });
    }

    exports.getJoinedGroups = function getJoinedGroups(uid, callback) {
        redis.smembers('u:'+uid+':jg', function(err, gids) {
                if(err) {return callback(err);}
                async.map(gids, exports.getGroup, callback);
        });
    }

    exports.getOwnedGroups = function getOwnedGroups(uid, callback) {
        redis.smembers('u:'+uid+':cg', function(err, gids) {
                if(err) {return callback(err);}
                async.map(gids, exports.getGroup, callback);
        });
    }

    exports.getMembers = function getMembers(gid, cursor, count, callback) {
        // redis.sscan('g:' + gid + ':u', cursor, 'MATCH', '*',count, cclog.intercept('show get memebers', callback));
        redis.srandmember_map('g:' + gid + ':u', count, userdao.get, callback);
    }

    exports.assertUserInGroup = function assertUserInGroup(uid, gid, callback) {
        redis.sismember('g:' + gid + ':u', uid, function(err, yes) {
                if(err) {return callback(err);}
                if(!yes) {return callback(new Error('user ' + uid + ' is not in group ' + gid))}
                callback();
        });
    }

    exports.isMember = function isMember(uid, gid, callback) {
      redis.sismember('g:' + gid + ':u', uid, callback);
    }