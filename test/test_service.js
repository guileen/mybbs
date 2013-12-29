var should = require('should');
var service = require('./context').service;

describe('service', function(){
        // 只测试致命bug，创建用户，不可重名
        describe('#createUser', function(){
                it('should save successfully', function(done) {
                        service.createUser({username:'foo'}, function(err, user) {
                                if(err) return done(err);
                                user.username.should.equal('foo');
                                should.exists(user.id);
                                done();
                        });
                });

                it('should not save duplicate', function(done) {
                        service.createUser({username:'bar'}, function(err, bar) {
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
                                owner: 1
                        }, done);
                })
        })

        // 加入群组
        describe('#joinGroup', function() {
                it('should join successfully', function(done) {
                        service.createUser({username:'user2'}, function(err, user) {
                                if(err) {return callback(err);}
                                service.joinGroup(user.id, 1, function(err, data) {
                                        if(err) {return callback(err);}
                                        service.assertUserInGroup(user.id, 1, done);
                                })
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
