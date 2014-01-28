var should = require('should');
var cclog = require('cclog');
var service = require('./context').service;
var homegroup = require('../lib/services/homegroup');
var userdao = require('../lib/services/userdao');
var topicdao = require('../lib/services/topicdao');

describe('service', function(){

        var uid1, uid2, gid1, gid2, tid1, tid2;
        before(function(done) {
                userdao.create({email:'test1@bar.com', password:'pass123'}, function(err, user) {
                        if(err) return done(err);
                        uid1 = user.id;
                        userdao.create({email:'test2@bar.com', password:'pass123'}, function(err, user) {
                                if(err) {return done(err);}
                                uid2 = user.id;
                                service.createGroup({name: 'group1', owner:uid1}, function(err, group) {
                                        if(err) {return callback(err);}
                                        gid1 = group.id;
                                        service.createGroup({name: 'group2', owner:uid2}, function(err, group) {
                                                if(err) {return callback(err);}
                                                gid2 = group.id;
                                                should.exists(uid1);
                                                should.exists(uid2);
                                                should.exists(gid1);
                                                should.exists(gid2);
                                                done();
                                        })
                                })
                        })
                });
        });

        // 只测试致命bug，创建用户，不可重名
        describe('#createUser', function(){
                it('should save successfully', function(done) {
                        userdao.create({email:'foo@bar.com', password:'pass123'}, function(err, user) {
                                if(err) return done(err);
                                user.email.should.equal('foo@bar.com');
                                user.password.should.not.equal('pass123')
                                should.exists(user.id);
                                done();
                        });
                });

                it('should not save duplicate', function(done) {
                        userdao.create({email:'foo1@bar.com'}, function(err, bar) {
                                if(err) done(err);
                                userdao.create({username:'bar'}, function(err, bar) {
                                        should.exists(err);
                                        done();
                                });
                        });
                });
        });

        // 创建群组
        describe('#createGroup', function(){
                it('should save successfully', function(done) {
                        service.createGroup({
                                owner: uid1
                        }, done);
                })
        })

        // 加入群组
        describe('#joinGroup', function() {
                it('should join successfully', function(done) {
                        service.joinGroup(uid1, gid2, function(err, data) {
                                if(err) {return callback(err);}
                                service.assertUserInGroup(uid1, gid2, done);
                        })
                })
                // 获得用户群组列表
                it('should get groups', function(done) {
                        service.getJoinedGroups(uid1, function(err, groups) {
                                if(err) {return callback(err);}
                                groups.length.should.eql(3);
                                done();
                        })
                })

        })

        // 发帖
        describe('#createTopic', function(){
                it('should create topic successfully', function(done) {
                        topicdao.create({uid: uid1, gid: gid1}, function(err, data) {
                            if(err) {return done(err);}
                            tid1 = data.id;
                            done();
                        })
                })
        })

        describe('#getTopic', function() {
                before(function(done) {
                        topicdao.create({uid: uid1, gid: gid1, text: 'show me the'}, function (err, data) {
                                if(err) return done(err);
                                tid2 = data.id;
                                done();
                        })
                })
                it('should get topic successfully', function(done){
                        topicdao.get(tid2, done);
                })
        })

        // 回复
        describe('#createReply', function() {
                it('should create reply successfully', function(done) {
                        topicdao.createComment({uid:uid1, tid: tid1}, done);
                })
        })

        describe('#getHomeGroup', function() {
                it('should get home groups', function(done) {
                        homegroup.getHomeGroup(1, function(err, data) {
                                console.log('homegroup', data);
                                done(err);
                        })
                })
        })
})
