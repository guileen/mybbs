var cclog = require('cclog');
var homegroup = require('../lib/services/homegroup');
var groupdao = require('../lib/services/groupdao');
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
          if(err) {return callback(err);}
          user.joinedGroups = [];
          if(homeGroups.length == 0) {
            return res.redirect('/group/explore')
          }
          groupdao.getJoinedGroups(user.id, function(err, joinedGroups) {
                  if(err) {return callback(err);}
                  user.joinedGroups = joinedGroups;
                  res.render('home', {
                          homeGroups: homeGroups
                        , joinedGroups: joinedGroups
                  });
          })
      })
  })
}
