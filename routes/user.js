var util = require('../lib/util');
var userdao = require('../lib/services/userdao');

module.exports = function(app) {

  app.get('/signup', function(req, res) {
      res.render('user/signup', {});
  });

  app.post('/signup', function(req, res) {
      var body = req.body;
      if(body.agree) {
        userdao.create({
            nickname: body.nickname
          , password: body.password
          , email: body.email
        }, function(err, userInfo) {
            // TODO 500.
            if(err) {
              if(err.code == 'USEREXIST') {
                body.exists = true;
                return res.render('user/signup', body);
              }

            }
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
                // TODO last url.
                res.redirect('/');
            })
        })
      } else {
        res.render('user/signup', body);
      }
  });

  app.get('/signin', function(req, res, next) {
      res.render('user/signin', {})
  });

  app.post('/signin', function(req, res, next) {
          var body = req.body;
          var email = body.email;
          if(email) {
              userdao.getByEmailOrId(email, function(err, userInfo) {
                      if(err) {return callback(err);}
                      if(!userInfo) {
                          return res.format({
                                  html: function() {
                                    res.render('user/signin', {
                                        code: 'notexists'
                                    })
                                  }
                                , json: function() {
                                      res.send({code: 'notexist'});
                                  }
                          })
                      }
                      if(util.secrets.equals(body.password, userInfo.password)) {
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
                                  // TODO last url.
                                  return res.format({
                                          html: function(){
                                              res.redirect('/');
                                          },

                                          json: function(){
                                              res.send({code: 'success'});
                                          }
                                  });
                          });
                      }
              })
          }
  })

  app.get('/signout', function(req, res, next) {
          req.session.regenerate(function(){
                  res.redirect('/')
          })
  })
}
