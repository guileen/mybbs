var cclog = require('cclog');
var topicdao = require('../lib/services/topicdao');
var groupdao = require('../lib/services/groupdao');
var common = require('../common/common')
var helpers = require('./helpers')
module.exports = function(app) {

  // tiopic view by slug url
  app.get('/t/:tid', function(req, res, next) {
          topicdao.getDetail(req.params.tid, function(err, topic) {
              var user = req.session.user;
              groupdao.isMember(user && user.id, topic.group.id, function(err, isMember) {
                  if(err) throw err;
                  if(!topic) {
                      res.writeHead(404, 'Not Found');
                      return res.end('No such topic');
                  }
                  if(topic.group.privacy == common.PRIVACY_TEAM && !isMember) {
                      res.writeHead(403, 'Not allowed')
                  }
                  res.format({
                      json: function() {
                        res.send(topic)
                      }
                    , html: function() {
                        res.render('topic/detail', {topic: topic});
                      }
                  })
              })
          });
  });

  // tiopic.
  app.get('/topic/create', helpers.requireLogin, function(req, res, next) {
      var user = req.session.user;
      groupdao.getJoinedGroups(user && user.id, function(err, joinedGroups) {
          if(err) {
            cclog.error(err.message);
            return res.error(err);
          }
          res.render('topic/create', {
              gid: req.query.gid
            , joinedGroups: joinedGroups
          });
      });
  });

  app.post('/topic/create', helpers.requireLogin, function(req, res, next) {
          var body = req.body;
          topicdao.create({
                  gid: body.gid
                , uid: req.session.user.id
                , txt: body.txt
                }, function(err, data /* 分词tags */) {
                  if(err) {
                      cclog.error(err);
                      return res.json({err: err.message})
                  }
                  // 
                  res.json({id:data.id, gid: data.gid});
          })
  });

  app.post('/topic/comment', helpers.requireLogin, function(req, res, next) {
      var body = req.body;
      topicdao.createComment({
          tid: body.tid
        , txt: body.txt
        , uid: req.session.user.id
        }, function(err, data) {
          if(err) {return callback(err);}
          res.json(data);
      })
  })

}
