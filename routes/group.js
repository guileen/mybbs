var homegroup = require('../lib/services/homegroup');
var explorer = require('../lib/services/explorer');
var groupdao = require('../lib/services/groupdao');

module.exports = function(app) {

  // group view by slug url
  app.get('/g/:group', function(req, res, next) {
      var gid = req.params.group;
      groupdao.getGroup(gid, function(err, group) {
          if(err) throw err;
          if(!group) {
            res.writeHead(404, 'Not Found');
            return res.end('No such group');
          }
          var user = req.session.user;
          groupdao.isMember(user && user.id, gid, function(err, isGroupMember) {
          homegroup.getGroupTopics(gid, 0, -1, function(err, topics) {
              if(group.privacy == '1') {
                  if(!user) return res.send(403, 'not allowed');
                  if(!isGroupMember) topics = [];
              }
              res.render('group/list', {
                  group: group
                , topics: topics
                , isGroupMember: isGroupMember
              })
          })
          })
      })
  });

  app.get('/g/:group/detail', function(req, res) {
      var gid = req.params.group;
      var user = req.session.user;
      groupdao.getGroup(gid, function(err, group) {
          groupdao.isMember(user && user.id, gid, function(err, isGroupMember) {
              if(group.privacy == '1' && !isGroupMember) {
                  return res.send(403, 'not allowed')
              }
              groupdao.getMembers(gid, 0, 50, function(err, members) {
                  if(err) console.log(err.stack || err);
                  res.render('group/detail', {
                      group: group
                    , isGroupMember: isGroupMember
                    , members: members
                  })
              })
          })
      })
  })

  // group view by slug url
  app.get('/g/:group/join', function(req, res, next) {
      var gid = req.params.group;
      var user = req.session.user;
      if(!user) return res.send(403, 'Not Login');
      groupdao.joinGroup(user.id, req.params.group, function(err) {
          if(err) throw err;
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
          groupdao.createGroup({
                  name: body.name
                , owner: req.session.user.id
                , privacy: body.privacy
                , question: body.question || ''
                , answer: body.answer || ''
                , approve: body.approve || 0
          }, function(err, data) {
                  if(err) {return callback(err);}
                  res.format({
                      json: function() {
                        res.send(data);
                      }
                    , html: function() {
                        res.redirect('/g/' + data.id);
                      }
                  })
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
