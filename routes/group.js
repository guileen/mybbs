var homegroup = require('../lib/services/homegroup');
var explorer = require('../lib/services/explorer');
var groupdao = require('../lib/services/groupdao');
var common = require('../common/common');
var cclog = require('cclog');
var helpers = require('./helpers');

module.exports = function(app) {

  // group view by slug url
  app.get('/g/:gid', helpers.initGroup, function(req, res, next) {
      var gid = req.params.gid;
      homegroup.getGroupTopics(gid, 0, -1, function(err, topics) {
          res.render('group/list', {
              topics: topics
          })
      })
  });

  app.get('/g/:gid/admin', helpers.initGroup, function(req, res) {
      var gid = req.params.gid;
      groupdao.getTopInviters(gid, 50, function(err, users, invites) {
          if(err) throw err;
          res.render('group/admin', {
              users: users
            , invites: invites
          })
      })
  })

  app.get('/g/:gid/members', helpers.initGroup, function(req, res) {
      var gid = req.params.gid;
      groupdao.getMembers(gid, 0, 50, function(err, members) {
          if(err) console.log(err.stack || err);
          res.render('group/members', {
              members: members
          })
      })
  })

  // group view by slug url
  app.post('/g/:gid/join', helpers.requireLogin, helpers.initGroup, function(req, res, next) {
      var gid = req.params.gid;
      groupdao.joinGroup(req.session.user.id, gid, function(err) {
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
  app.get('/group/create', helpers.requireLogin, function(req, res, next) {
          res.render('group/create');
  });

  app.post('/group/create', helpers.requireLogin, function(req, res, next) {
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

  // ref codes
  app.get('/g/:gid/refstats', helpers.requireLogin, helpers.initGroup, function(req, res, next) {
      groupdao.getAllRefCodeInfo(req.params.gid, req.session.user.id, function(err, refList) {
          if(err) throw err;
          res.render('group/refstats', {
              refList: refList
          })
      })
  })

  app.post('/g/:gid/makeref', helpers.requireLogin, helpers.initGroup, helpers.requireMember, function(req, res, next) {
      var gid = req.params.gid;
      var uid = req.session.user.id;
      var count = parseInt(req.body.count) || 0;
      var remark = req.body.remark;
      groupdao.refCount(gid, uid, function(err, refcount) {
          if(refcount > 10) return res.send(403, {code: 'exceed-max'});
          groupdao.makeGroupRefCode(gid, uid, count, remark, function(err, code) {
              res.format({
                  json: function() {
                    res.send({refcode: code, count: count});
                  }
                , html: function() {
                    res.redirect('/g/'+gid+'/refstats');
                  }
              })
          })
      })
  })

  app.get('/gr/:code', function(req, res, next) {
      var user = req.session.user;
      var code = req.params.code;
      groupdao.getRefCodeInfo(code, function(err, refInfo) {
          if(err) throw err;
          groupdao.isMember(user && user.id, refInfo.gid, function(err, isMember){

          groupdao.getLatestAccepters(code, 5, function(err, accepters, acceptTimes) {

          if(err) throw err;
          res.render('group/refinfo', {
              refInfo: refInfo
            , group: refInfo.group
            , refUser: refInfo.user
            , isMember: isMember
            , accepters: accepters
            , acceptTimes: acceptTimes
          })

          })

          })
      })
  });

  app.get('/gr/:code/join', helpers.requireLogin, function(req, res, next) {
      res.redirect('/gr/'+req.params.code);
  })

  app.post('/gr/:code/join', helpers.requireLogin, function(req, res, next) {
      groupdao.joinWithRefCode(req.session.user.id, req.params.code, function(err, info) {
          if(err) {
            return res.send(500, err.message);
          }
          res.redirect('/g/' + info.gid);
      });
  })

}
