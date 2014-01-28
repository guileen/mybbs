var cclog = require('cclog');
var topicdao = require('../lib/services/topicdao')
module.exports = function(app) {

  // tiopic view by slug url
  app.get('/t/:tid', function(req, res, next) {
          topicdao.getDetail(req.params.tid, function(err, topic) {
                  if(err) throw err;
                  if(!topic) {
                      res.writeHead(404, 'Not Found');
                      return res.end('No such topic');
                  }
                  res.format({
                      json: function() {
                        res.send(topic)
                      }
                    , html: function() {
                        res.render('topic/detail', {topic: topic});
                      }
                  })
          });
  });

  // tiopic.
  app.get('/topic/create', function(req, res, next) {
      app.services.getJoinedGroups(req.session.user.id, function(err, joinedGroups) {
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

  app.post('/topic/create', function(req, res, next) {
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

  app.post('/topic/comment', function(req, res, next) {
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
