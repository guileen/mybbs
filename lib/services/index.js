var util = require('../util');
var async = require('async');
var cclog = require('cclog');
var homegroup = require('./homegroup');
var explorer = require('./explorer');
var userdao = require('./userdao');
var topicdao = require('./topicdao');
var groupdao = require('./groupdao');

var redis;
exports.init = function(_redis) {
    // id:user
    // all:users
    // uname:{username}:id   get uid of a username
    // u:{uid}        hash info of user
    //
    // id:group
    // id:topic
    // all:groups
    // all:topics
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
    redis = _redis;
    homegroup.init(redis);
    explorer.init(redis);
    userdao.init(redis);
    topicdao.init(redis);
    groupdao.init(redis);
}

exports.getRedisClient = function () {
    return redis;
}
