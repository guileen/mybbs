module.exports = function(app) {

  app.get('/signup', function(req, res) {
      res.render('user/signup', {});
  });

  app.post('/signup', function(req, res) {
      res.render('user/signup', {
          nickname: req.body.nickname
        , password: req.body.password
        , email: req.body.email
      });
  });

}
