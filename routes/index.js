var cclog = require('cclog');
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
      homegroup.getHomeGroup(user.id, function(err, homeGroups) {
          cclog('=========== groups ============= ', JSON.stringify(homeGroups));
      // app.services.getJoinedGroups(user.id, function(err, groups) {
          if(err) {return callback(err);}
          app.services.getJoinedGroups(user.id, function(err, joinedGroups) {
                  if(err) {return callback(err);}
                  user.joinedGroups = joinedGroups;
                  res.render('home', {
                          homeGroups: homeGroups
                  });
          })
      })
  })
}
