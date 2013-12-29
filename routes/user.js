module.exports = function(app) {

  app.get('/signup', function(req, res) {
      res.render('user/signup', {});
  });

  app.post('/signup', function(req, res) {
      var body = req.body;
      if(body.agree) {
        app.services.createUser({
            nickname: body.nickname
          , password: body.password
          , email: body.email
        }, function(err, userInfo) {
            // TODO 500.
            if(err) {return callback(err);}
            req.session.regenerate(function(){
                req.session.user = userInfo;
                // remember me or not
                if(body.rememberme) {
                  req.session.cookie.expires = false;
                  req.session.cookie.maxAge = 3 * 365 * 24 * 60 * 60 * 1000;
                } else {
                  req.session.cookie.expires = true;
                  req.session.cookie.maxAge = 10 * 1000;
                }
                // TODO last url.
                res.redirect('/');
            })
        })
      } else {
        res.render('user/signup', {
            nickname: body.nickname
          , password: body.password
          , email: body.email
          , rememberme: body.rememberme
        });
      }
  });

}
