var cclog = require('cclog');
module.exports = function(app) {

  // tiopic view by slug url
  app.get('/t/:tiopic', function(req, res, next) {
  });


  // tiopic.
  app.get('/topic/create', function(req, res, next) {
          res.render('topic/create', {
              gid: req.query.gid
          });
  });

  app.post('/topic/create', function(req, res, next) {
          var body = req.body;
          app.services.topic.create({
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

  app.get('/topic/:topicid/step-2', function(req, res, next) {
      var tid = req.param('topicid');
      app.services.topic.get(tid, function(err, topic) {
          if(err) {
            cclog.error(err.stack);
            return res.json({err: err.message});
          }
          if(topic.uid != req.session.user.id) {
            return res.json({err: 'permission denined'});
          }
          res.render('topic/step-2', {topic: topic, groups: req.session.user.groups});
      })
  })

  // tiopic view by id
  app.get('/topic/:tiopicid', function(req, res, next) {
          app.services.topic.get(req.params.tiopicid, function(err, data) {
                  if(err) {return callback(err);}
                  res.send(data);
          });
  })

}
