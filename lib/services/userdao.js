var redis;
var util = require('../util');
var async = require('async');
var cclog = require('cclog');

exports.init = function(redisClient) {
    redis = redisClient;
}

// id:user
// all:users
// email:{email}:id   get uid of a email
// u:{uid}        hash info of user

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
exports.create = function create(info, callback) {
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
                    });
            })
    })
}

exports.get = function get(uid, callback) {
    redis.hgetall('u:' + uid, function(err, info) {
            // TODO some data type cast. int, date, etc.
            if(info) info.password == null;
            callback(err, info);
    });
}

exports._getByEmail = function getByEmail(email, callback) {
    redis.get('email:' + email + ':id', function(err, id) {
            if(err) {return callback(err);}
            redis.hgetall('u:'+id, callback);
    })
}

exports.verifyByEmailOrId = function(str, password, callback){
    function verify(err, info) {
      if(err) return callback(err);
      if(!info) {
        var err = new Error('notexists');
        err.code = 'notexists';
        return callback(err);
      } else if(!util.secrets.equals(password,info.password)) {
        var err = new Error('badpass');
        err.code = 'badpass';
        return callback(err);
      }
      info.password = undefined;
      return callback(null, info);
    }
    if(str.indexOf('@') > 0) {
        exports._getByEmail(str, verify);
    } else {
      redis.hgetall('u:'+str, verify);
    }
}

exports.assertExistsUser = function assertExistsUser(uid, callback) {
    if(!uid) return callback(new Error('user ' + uid + ' is null'));
    redis.exists('u:' + uid, function(err, exists) {
            if(err) {return callback(err);}
            if(!exists) return callback(new Error('user ' + uid + ' is not exists'));
            callback();
    })
}
