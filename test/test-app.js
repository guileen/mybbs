var init = require('./init');
var mock = require('./mock');
var http = require('http');
var server = require('../app');
var client = mock.httpClient(server);
var should = require('should')
var async = require('async')
var common = require('../common/common')
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

var uid1, uid2, teamGroup, teamTopic, teamRefCode, opengroup, opentopic, personalGroup;
before(function(done) {
        function signupUser1(callback) {
            console.log('signup');
            shouldpost('/signup', {nickname:'user1', password:'123456', email: 'user1@ibbs.cc'}, callback)
        }
        function signupUser2(callback) {
            console.log('signup');
            shouldpost('/signup', {nickname:'user2', password:'123456', email: 'user2@ibbs.cc'}, callback)
        }
        function signinUser1(callback) {
            console.log('signin');
            shouldpost('/signin', {email: 'user1@ibbs.cc', password:'123456'}, callback, function(req, res) {
                    var user = req.session.user;
                    user.nickname.should.eql('user1');
                    uid1 = user.id;
            })
        }
        function createGroup(callback) {
            console.log('create team group');
            shouldpost('/group/create', {name: 'group1', privacy:common.PRIVACY_TEAM}, callback, function(req, res) {
                    var data = JSON.parse(res.sentcontent);
                    data.name.should.eql('group1');
                    teamGroup = data.id;
                    should.exists(teamGroup);
            })
        }
        function createTeamRefCode(callback) {
                shouldpost('/g/'+teamGroup+'/makeref', {count: 0}, callback, function(req, res) {
                        console.log(res.sentcontent);
                        var data = JSON.parse(res.sentcontent);
                        teamRefCode = data.refcode;
                        teamRefCode.should.be.ok;
                        data.count.should.eql(0);
                });
        }
        function createTopic(callback) {
            console.log('create team topic');
            shouldpost('/topic/create', {gid: teamGroup, txt:'blablabla....'}, callback, function(req, res) {
                    var data = JSON.parse(res.sentcontent);
                    teamTopic = data.id;
            });
        }
        function createHideGroup(callback) {
            console.log('create hide group');
            shouldpost('/group/create', {name: 'group1', privacy:common.PRIVACY_PERSONAL}, callback, function(req, res) {
                    var data = JSON.parse(res.sentcontent);
                    data.name.should.eql('group1');
                    personalGroup = data.id;
                    should.exists(personalGroup);
            })
        }
        function createOpenGroup(callback) {
            console.log('create open group');
            shouldpost('/group/create', {name: 'group1', privacy:common.PRIVACY_PUBLIC}, callback, function(req, res) {
                    var data = JSON.parse(res.sentcontent);
                    data.name.should.eql('group1');
                    opengroup = data.id;
                    should.exists(opengroup);
            })
        }
        function createOpenTopic(callback) {
            console.log('create open topic');
            shouldpost('/topic/create', {gid: opengroup, txt:'blablabla....'}, callback, function(req, res) {
                    var data = JSON.parse(res.sentcontent);
                    opentopic = data.id;
            });
        }
        function signout(callback) {
            console.log('signout');
            shouldget('/signout', callback, function(req, res) {
                    should.not.exists(req.session.user);
            });
        }
        async.series([
                signupUser1
              , signupUser2
              , signinUser1
              , createGroup
              , createTeamRefCode
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
        itshouldnotget('/group/create');
        itshouldnotpost('/group/create', {name:'foo', privacy:'1'});
        itshouldnotget('/topic/create');
        itshouldnotpost('/topic/create', {txt:'blablablabla', gid: opengroup});
        it('should NOT get /g/:teamgroup', function(done) {
                shouldnotget('/g/' + teamGroup, done);
        })
        it('should get /u/:uid', function(done) {
                shouldget('/u/'+uid1, done);
        })
        it('should get /gr/:teamRefCode', function(done) {
                shouldget('/gr/'+teamRefCode, done);
        })
        it('should NOT post /gr/:teamRefCode/join', function(done) {
                shouldnotpost('/gr/'+teamRefCode+'/join', {}, done);
        })
        it('should NOT get /g/:teamgroup/detail', function(done) {
                shouldnotget('/g/'+teamGroup+'/detail', done);
        })
        it('should NOT post /g/:teamgroup/join', function(done) {
                shouldnotpost('/g/'+teamGroup+'/join', {}, done);
        })
        it('should NOT get /t/teamtopic', function(done) {
                shouldnotget('/t/'+teamTopic, done);
        })
        it('should get /g/:opengroup/detail', function(done) {
                shouldget('/g/'+opengroup+'/detail', done);
        })
        it('should NOT post /g/:opengroup/join', function(done) {
                shouldnotpost('/g/'+opengroup+'/join', {}, done);
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
        it('should post /g/:opengroup/join', function(done) {
                shouldpost('/g/'+opengroup+'/join', {}, done);
        })
        it('should get / after join', function(done) {
                shouldget('/', done);
        })

        // team group
        it('should not get /g/:teamgroup', function(done) {
                shouldnotget('/g/' + teamGroup, done);
        });
        it('should NOT get /g/:teamgroup/detail', function(done) {
                shouldnotget('/g/'+teamGroup+'/detail', done);
        });
        it('should NOT get /t/teamtopic', function(done) {
                shouldnotget('/t/'+teamTopic, done);
        });
        it('should NOT post /g/:teamgroup/join', function(done) {
                shouldnotpost('/g/' + teamGroup + '/join', {}, done);
        });
        it('should get /gr/:teamRefCode', function(done) {
                shouldget('/gr/'+teamRefCode, done);
        })
        it('should post /gr/:teamRefCode/join', function(done) {
                shouldpost('/gr/'+teamRefCode+'/join', {}, done, function(req, res) {
                        var uid = req.session.user.id;
                        groupdao.isMember(uid, teamGroup, function(err, isMember) {
                                should.not.exists(err);
                                isMember.should.be.ok;
                        })
                });
        })
        describe('Member', function() {
                it('should get /t/teamtopic after join', function(done) {
                        shouldget('/t/'+teamTopic, done);
                });

                it('should get /g/:gid/refstats', function(done) {
                        shouldget('/g/'+teamGroup+'/refstats', done);
                });

                var myRefCode;
                it('should post /g/:gid/makeref', function(done) {
                        shouldpost('/g/'+teamGroup+'/makeref', {count: 0}, done, function(req, res) {
                                var data = JSON.parse(res.sentcontent);
                                myRefCode = data.refcode;
                                should.exists(myRefCode)
                                data.count.should.eql(0);
                        });
                })

                it('should not join if already a group member /gr/:code/join', function(done) {
                        shouldnotpost('/gr/'+myRefCode+'/join', {}, done);
                })

                it('should get /g/:gid/refstats after make code', function(done) {
                        shouldget('/g/'+teamGroup+'/refstats', done);
                });

                describe('User1', function() {
                        before(function(done) {
                                async.series([
                                        shouldget.bind(null, '/signout')
                                      , shouldpost.bind(null, '/signin', {email:'user1@ibbs.cc', password:'123456'})
                                ], done)
                        })
                        it('should get /g/:gid/refstats after member join', function(done) {
                                shouldget('/g/'+teamGroup+'/refstats', done);
                        });

                })
        })

});
