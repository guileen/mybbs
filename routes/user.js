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
        }, function(err, results) {
            // TODO 500.
            // TODO session, remember me.
            if(err) {return callback(err);}
            // last url.
            res.redirect('/');
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
