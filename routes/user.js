var util = require('../lib/util');
var config = require('../config');
var userdao = require('../lib/services/userdao');
var groupdao = require('../lib/services/groupdao');
var async = require('async');
var cclog = require('cclog');

module.exports = function(app) {

  app.get('/u/:uid', function(req, res) {
          var uid = req.params.uid;
          userdao.get(uid, function(err, user) {
                  if(err) throw err;
                  if(!user) {
                      return res.send(404, 'No such user');
                  }
                  res.render('user/info', {
                          userInfo: user
                  });
          })
  })

  app.get('/signup', function(req, res) {
          var body = req.body;
          res.render('user/signup', {
                  nickname: body.nickname
                , email: body.email
                , lasturl: req.query.lasturl
          });
  });

  app.post('/signup', function(req, res) {
      var body = req.body;
        userdao.create({
            nickname: body.nickname
          , password: body.password
          , email: body.email
        }, function(err, userInfo) {
            if(err) {
              if(err.code == 'USEREXIST') {
                body.exists = true;
                return res.render('user/signup', body);
              }
              res.writeHead(500)
              return res.send('error')
            }
            async.each(config.initgroups, groupdao.joinGroup.bind(null, userInfo.id), cclog.ifError);
            req.session.regenerate(function(){
                req.session.user = userInfo;
                // remember me or not
                if(body.rememberme) {
                  req.session.cookie.expires = false;
                  req.session.cookie.maxAge = 3 * 365 * 24 * 60 * 60 * 1000;
                } else {
                  req.session.cookie.expires = true;
                  req.session.cookie.maxAge = 24 * 60 * 60 * 1000;
                }
                res.redirect(body.lasturl != 'undefined' && body.lasturl || ('/t/' + config.inittopic));
            })
        })
  });

  app.get('/signin', function(req, res, next) {
      res.render('user/signin', {lasturl: req.query.lasturl})
  });

  app.post('/signin', function(req, res, next) {
          var body = req.body;
          var email = body.email;
          if(email) {
              userdao.verifyByEmailOrId(email, body.password, function(err, userInfo) {
                  if(err) {
                    return res.format({
                        html: function() {
                          res.render('user/signin', {
                              code: err.code
                            , email: email
                            , lasturl: body.lasturl
                          })
                        }
                      , json: function() {
                          res.send(403, {code: errcode});
                        }

                    })
                  }
                  req.session.regenerate(function(){
                      req.session.user = userInfo;
                      // remember me or not
                      if(body.rememberme) {
                        req.session.cookie.expires = false;
                        req.session.cookie.maxAge = 3 * 365 * 24 * 60 * 60 * 1000;
                      } else {
                        req.session.cookie.expires = false;
                        req.session.cookie.maxAge = 3 * 365 * 24 * 60 * 60 * 1000;
                      }
                      res.format({
                          html: function(){
                            res.redirect(body.lasturl || '/');
                          },

                          json: function(){
                            res.send({code: 'success'});
                          }
                      });
                  });
              });
          }
  })

  app.get('/signout', function(req, res, next) {
          req.session.regenerate(function(){
                  res.redirect('/')
          })
  })
}
