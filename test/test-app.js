var init = require('./init');
var mock = require('./mock');
var http = require('http');
var server = require('../app');
var client = mock.httpClient(server);
var should = require('should')
var async = require('async')

describe('app.js', function(){
        it('should 404', function(done) {
                http.ServerResponse.should.equal(mock.MockResponse);
                client.get('/foo', function(req, res) {
                        res.statusCode.should.eql(404);
                        done();
                });
        })
})

function shouldget(path, done, onEnd) {
    client.get(path, function(req, res) {
            if(onEnd) {
                onEnd(req, res);
            } else if(res.statusCode >= 400){
                return done(new Error('Status: ' + res.statusCode + ' ' + res.statusMessage));
            }
            done();
    });
}

function shouldnotget(path, done) {
    shouldget(path, done, function onEnd(req, res) {
            res.statusCode.should.be.below(500);
            res.statusCode.should.not.eql(200);
    })
}

function shouldpost(path, body, done, onEnd) {
    client.post(path, body, function(req, res) {
            if(onEnd) {
                onEnd(req, res);
            } else if(res.statusCode >= 400){
                return done(new Error('Status: ' + res.statusCode + ' ' + res.statusMessage));
            }
            done();
    });
}

function shouldnotpost(path, body, done) {
    shouldpost(path, body, done, function onEnd(req, res) {
            res.statusCode.should.less.than(500);
            res.statusCode.should.not.eql(200);
    })
}

function itshouldget(path, onEnd) {
    it('should get ' + path, function(done) {
            shouldget(path, done, onEnd);
    })
}

function itshouldpost(path, body, onEnd) {
    it('should post ' + path, function(done) {
            shouldpost(path, body, done, onEnd);
    })
}

var uid1, gid1, tid1;
before(function(done) {
        function signup(callback) {
            client.post('/signup', {nickname:'user1', password:'123456', email: 'user1@ibbs.cc'}, function(req, res) {
                    callback();
            })
        }
        function signin(callback) {
            client.post('/signin', {email: 'user1@ibbs.cc', password:'123456'}, function(req, res) {
                    console.log('req headers', req.headers);
                    console.log('res headers', res.headers);
                    var user = req.session.user;
                    user.nickname.should.eql('user1');
                    uid1 = user.id;
                    callback();
            })
        }
        function createGroup(callback) {
            client.post('/group/create', {name: 'group1', privacy:'1'}, function(req, res) {
                    console.log('req headers', req.headers);
                    console.log('res headers', res.headers);
                    var data = JSON.parse(res.sentcontent);
                    console.log(data);
                    data.name.should.eql('group1');
                    gid1 = data.id;
                    should.exists(gid1);
                    callback();
            })
        }
        function createTopic(callback) {
            client.post('/topic/create', {gid: gid1, txt:'blablabla....'}, function(req, res) {
                    var data = JSON.parse(res.sentcontent);
                    tid1 = data.id;
                    callback();
            });
        }
        function signout(callback) {
            client.get('/signout', function(req, res) {
                    should.not.exists(req.session.user);
                    callback();
            });
        }
        async.series([
                signup
              , signin
              , createGroup
              , createTopic
              , signout
        ], done);
})

describe('Guest', function(){
        itshouldget('/');
        itshouldget('/signin');
        itshouldget('/signup');
        it('should get /g/:gid', function(done) {
                shouldget('/g/' + gid1, done);
        })
        it('should get /g/:gid/detail', function(done) {
                shouldget('/g/'+gid1+'/detail', done);
        })
        it('should not get /g/:gid/join', function(done) {
                shouldnotget('/g/'+gid1+'/join', done);
        })
        it('should get /u/:uid', function(done) {
                shouldget('/u/'+uid1, done);
        })
        it('should not get /t/:tid', function(done) {
                shouldget('/t/'+tid1, done);
        })
})

describe('None-member-user', function(){
        var uid2;
        itshouldget('/');
        itshouldget('/signin');
        itshouldget('/signup');
        itshouldpost('/signup', {nickname: '风清扬', password: '123456', email: 'gl@gl.com'});
        itshouldpost('/signin', {email: 'gl@gl.com', password: '123456'}, function(req, res) {
                req.session.user.nickname.should.eql('风清扬');
                uid2 = req.session.user.id;
        });
        it('should get /g/:gid', function(done) {
                shouldget('/g/' + gid1, done);
        });
        it('should get /g/:gid/detail', function(done) {
                shouldget('/g/'+gid1+'/detail', done);
        });
        it('should get /u/:uid', function(done) {
                shouldget('/u/'+uid1, done);
        });
        it('should get /t/:tid', function(done) {
                shouldget('/t/'+tid1, done);
        });


        // ====== test join group should not be called before others======
        it('should get /g/:gid/join', function(done) {
                shouldget('/g/'+gid1+'/join', done);
        });
});

describe('Member user', function(){

})
