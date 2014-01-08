var should = require('should');
var service = require('./context').service;

describe('service', function(){

        var uid1, uid2, gid1, gid2;
        before(function(done) {
                service.createUser({email:'test1@bar.com', password:'pass123'}, function(err, user) {
                        if(err) return done(err);
                        uid1 = user.id;
                        service.createUser({email:'test2@bar.com', password:'pass123'}, function(err, user) {
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
                        service.createUser({email:'foo@bar.com', password:'pass123'}, function(err, user) {
                                if(err) return done(err);
                                user.email.should.equal('foo@bar.com');
                                user.password.should.not.equal('pass123')
                                should.exists(user.id);
                                done();
                        });
                });

                it('should not save duplicate', function(done) {
                        service.createUser({email:'foo1@bar.com'}, function(err, bar) {
                                if(err) done(err);
                                service.createUser({username:'bar'}, function(err, bar) {
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
                        service.getGroupsOfUser(uid1, function(err, groups) {
                                if(err) {return callback(err);}
                                groups.length.should.eql(3);
                                done();
                        })
                })

        })

        // 发帖
        describe('#createTopic', function(){
                it('should create topic successfully', function(done) {
                        service.createTopic({uid: 1, gid: 1}, done)
                })
        })

        // 回复
        describe('#createReply', function() {
                it('should create reply successfully', function(done) {
                        service.createReply({uid:1, tid: 1}, done);
                })
        })
})
