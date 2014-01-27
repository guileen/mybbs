var homegroup = require('../lib/services/homegroup');
var explorer = require('../lib/services/explorer');

module.exports = function(app) {

  // group view by slug url
  app.get('/g/:group', function(req, res, next) {
      var gid = req.params.group;
      app.services.getGroup(gid, function(err, group) {
          homegroup.getGroupTopics(gid, 0, -1, function(err, topics) {
              res.render('group/list', {
                  group: group
                , topics: topics
              })
          })
      })
  });

  app.get('/g/:group/detail', function(req, res) {
      var gid = req.params.group;
      app.services.getGroup(gid, function(err, group) {
          app.services.isMember(req.session.user.id, gid, function(err, isJoinedGroup) {
              app.services.getMembers(gid, 0, 50, function(err, members) {
                  if(err) console.log(err.stack || err);
                  console.log(members);
                  res.render('group/detail', {
                      group: group
                    , isJoinedGroup: isJoinedGroup
                    , members: members
                  })
              })
          })
      })

  })

  // group view by slug url
  app.get('/g/:group/join', function(req, res, next) {
      var gid = req.params.group;
      app.services.joinGroup(req.session.user.id, req.params.group, function(err) {
          res.redirect('/g/' + gid);
      })
  });

  app.post('/group/search-join', function(req, res, next) {
      var gname = req.body.gname;
      explorer.searchGroup(gname, function(err, data) {
          if(err) {
            cclog.error(err);
            return res.json({err:1, msg: err.message});
          }
          if(data.length == 1) {
            return res.redirect('/g/' + data[0].id + '/join');
          }
          res.render('group/search-join', {
              groups: data
          })
      })
  })

  app.post('/group/search', function(req, res, next) {
      var gname = req.body.gname;
      explorer.searchGroup(gname, function(err, data) {
          if(err) {
            cclog.error(err);
            return res.json({err:1, msg: err.message});
          }
          res.json(data);
      })
  })

  // group.
  app.get('/group/create', function(req, res, next) {
          res.render('group/create');
  });

  app.post('/group/create', function(req, res, next) {
          var body = req.body;
          app.services.createGroup({
                  name: body.name
                , owner: req.session.user.id
                , privacy: body.privacy
                , question: body.question || ''
                , answer: body.answer || ''
                , approve: body.approve || 0
          }, function(err, data) {
                  if(err) {return callback(err);}
                  res.redirect('/g/' + data.id);
          })
  });

  app.get('/group/enter', function(req, res, next) {
          var groupname = req.query.groupname;
          groupname = groupname.replace(/\s/g, '');
          res.render('group/search_result', {
                  groups : []
                , groupname: groupname
                , tipcreate: true
          });
  });

  app.get('/group/explore', function(req, res, next) {
      explorer.randGroups(10, function(err, groups){
          res.render('group/explore', {
              groups: groups
          })
      })
  })

}
