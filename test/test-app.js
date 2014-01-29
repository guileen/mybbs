var init = require('./init');
var mock = require('./mock');
var http = require('http');
var server = require('../app');
var client = mock.httpClient(server);
var should = require('should')
var async = require('async')
var groupdao = require('../lib/services/groupdao');

describe('app.js', function(){
        it('should NOT get /blabla', function(done) {
                http.ServerResponse.should.equal(mock.MockResponse);
                client.get('/foo', function(req, res) {
                        res.statusCode.should.eql(404);
                        done();
                });
        })
})

function shouldget(path, done, onEnd) {
    client.get(path, function(req, res) {
            if(res.error) {
                return done(res.error);
            }
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
            if(res.error) {
                return done(res.error);
            }
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
            res.statusCode.should.be.below(500);
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

function itshouldnotget(path, onEnd) {
    it('should NOT get ' + path, function(done) {
            shouldnotget(path, done, onEnd);
    })
}

function itshouldnotpost(path, body, onEnd) {
    it('should NOT post ' + path, function(done) {
            shouldnotpost(path, body, done, onEnd);
    })
}

var uid1, privateGroup, privateTopic, opengroup, opentopic, hidegroup;
before(function(done) {
        function signup(callback) {
            console.log('signup');
            client.post('/signup', {nickname:'user1', password:'123456', email: 'user1@ibbs.cc'}, function(req, res) {
                    callback();
            })
        }
        function signin(callback) {
            console.log('signin');
            client.post('/signin', {email: 'user1@ibbs.cc', password:'123456'}, function(req, res) {
                    var user = req.session.user;
                    user.nickname.should.eql('user1');
                    uid1 = user.id;
                    callback();
            })
        }
        function createGroup(callback) {
            console.log('create team group');
            client.post('/group/create', {name: 'group1', privacy:'1'}, function(req, res) {
                    var data = JSON.parse(res.sentcontent);
                    data.name.should.eql('group1');
                    privateGroup = data.id;
                    should.exists(privateGroup);
                    callback();
            })
        }
        function createTopic(callback) {
            console.log('create team topic');
            client.post('/topic/create', {gid: privateGroup, txt:'blablabla....'}, function(req, res) {
                    var data = JSON.parse(res.sentcontent);
                    privateTopic = data.id;
                    callback();
            });
        }
        function createHideGroup(callback) {
            console.log('create hide group');
            client.post('/group/create', {name: 'group1', privacy:'2'}, function(req, res) {
                    var data = JSON.parse(res.sentcontent);
                    data.name.should.eql('group1');
                    hidegroup = data.id;
                    should.exists(hidegroup);
                    callback();
            })
        }
        function createOpenGroup(callback) {
            console.log('create open group');
            client.post('/group/create', {name: 'group1', privacy:'3'}, function(req, res) {
                    var data = JSON.parse(res.sentcontent);
                    data.name.should.eql('group1');
                    opengroup = data.id;
                    should.exists(opengroup);
                    callback();
            })
        }
        function createOpenTopic(callback) {
            console.log('create open topic');
            client.post('/topic/create', {gid: opengroup, txt:'blablabla....'}, function(req, res) {
                    var data = JSON.parse(res.sentcontent);
                    opentopic = data.id;
                    callback();
            });
        }
        function signout(callback) {
            console.log('signout');
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
              , createHideGroup
              , createOpenGroup
              , createOpenTopic
              , signout
        ], done);
})

describe('Guest', function(){
        itshouldget('/');
        itshouldget('/signin');
        itshouldget('/signup');
        itshouldget('/group/explore');
        itshouldnotget('/topic/create');
        it('should NOT get /g/:privategroup', function(done) {
                shouldnotget('/g/' + privateGroup, done);
        })
        it('should get /u/:uid', function(done) {
                shouldget('/u/'+uid1, done);
        })
        it('should NOT get /g/:privategroup/detail', function(done) {
                shouldnotget('/g/'+privateGroup+'/detail', done);
        })
        it('should NOT get /g/:privategroup/join', function(done) {
                shouldnotget('/g/'+privateGroup+'/join', done);
        })
        it('should NOT get /t/privatetopic', function(done) {
                shouldnotget('/t/'+privateTopic, done);
        })
        it('should get /g/:opengroup/detail', function(done) {
                shouldget('/g/'+opengroup+'/detail', done);
        })
        it('should NOT get /g/:opengroup/join', function(done) {
                shouldnotget('/g/'+opengroup+'/join', done);
        })
        it('should get /t/:opentid', function(done) {
                shouldget('/t/'+opentopic, done);
        })
})

describe('User', function(){
        var uid2;
        itshouldpost('/signup', {nickname: '风清扬', password: '123456', email: 'gl@gl.com'});
        it('should NOT /signin with bad username', function(done) {
                shouldnotpost('/signin', {email: 'glbalbal@gl.com', password: '1234'}, done);
        })
        it('should NOT /signin with bad password', function(done) {
                shouldnotpost('/signin', {email: 'gl@gl.com', password: '1234'}, done);
        })
        itshouldpost('/signin', {email: 'gl@gl.com', password: '123456'}, function(req, res) {
                req.session.user.nickname.should.eql('风清扬');
                uid2 = req.session.user.id;
        });
        itshouldget('/');
        itshouldget('/group/explore');
        itshouldget('/topic/create');
        it('should get /u/:uid', function(done) {
                shouldget('/u/'+uid1, done);
        });

        // private group
        it('should get /g/:privategroup', function(done) {
                shouldget('/g/' + privateGroup, done);
        });
        it('should NOT get /g/:privategroup/detail', function(done) {
                shouldnotget('/g/'+privateGroup+'/detail', done);
        });
        it('should NOT get /t/privatetopic', function(done) {
                shouldnotget('/t/'+privateTopic, done);
        });
        it('should get /g/:privategroup/join', function(done) {
                shouldget('/g/'+privateGroup+'/join', done, function(req, res) {
                        groupdao.isMember(req.session.user.id, privateGroup, function(err, isMember) {
                                should.not.exists(err);
                                isMember.should.be.ok;
                        })
                });
        });
        describe('Member', function() {

                it('should get /t/privatetopic after join', function(done) {
                        shouldget('/t/'+privateTopic, done);
                });

        })
        // open group
        it('should get /g/:opengroup', function(done) {
                shouldget('/g/'+opengroup, done);
        })
        it('should get /g/:opengroup/detail', function(done) {
                shouldget('/g/'+opengroup+'/detail', done);
        })
        it('should get /t/:opentid', function(done) {
                shouldget('/t/'+opentopic, done);
        })
        it('should get /g/:opengroup/join', function(done) {
                shouldget('/g/'+opengroup+'/join', done);
        })
        it('should get / after join', function(done) {
                shouldget('/', done);
        })

});
