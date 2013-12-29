module.exports = function(app) {
  require('./user')(app);

  /*
   * GET home page.
   */
  app.get('/', function(req, res){
      var user = req.session.user;
      console.log(user);
      res.render('index', { user: user });
  })
}
