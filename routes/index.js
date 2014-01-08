module.exports = function(app) {

  require('./user')(app);
  require('./group')(app);

  /*
   * GET home page.
   */
  app.get('/', function(req, res){
      var user = req.session.user;
      app.services.getGroupsOfUser(user.id, function(err, groups) {
          if(err) {return callback(err);}
          user.groups = groups;
          app.services.getOwnedGroups(user.id, function(err, ownedGroups) {
                  if(err) {return callback(err);}
                  user.ownedGroups = ownedGroups;
                  res.render('index', {});
          })
      })
  })
}
