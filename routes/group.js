var homegroup = require('../lib/services/homegroup');

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
                  res.redirect('/group/' + data.id);
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

  // group view by id
  app.get('/group/:groupid', function(req, res, next) {
          app.services.getGroup(req.params.groupid, function(err, data) {
                  if(err) {return callback(err);}
                  res.send(data);
          });
  })

}
