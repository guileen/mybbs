var homegroup = require('../lib/services/homegroup');
module.exports = function(app) {

  require('./user')(app);
  require('./group')(app);
  require('./topic')(app);

  /*
   * GET home page.
   */
  app.get('/', function(req, res){
      var user = req.session.user;
      if(!user) {
          return res.render('welcome');
      }
      homegroup.getHomeGroup(user.id, function(err, groups) {
          console.log('=========== groups ============= ', groups);
      // app.services.getGroupsOfUser(user.id, function(err, groups) {
          if(err) {return callback(err);}
          user.groups = groups;
          app.services.getOwnedGroups(user.id, function(err, ownedGroups) {
                  if(err) {return callback(err);}
                  user.ownedGroups = ownedGroups;
                  res.render('home', {});
          })
      })
  })
}
