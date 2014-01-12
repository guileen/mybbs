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
          }, function(err, data) {
                  if(err) {
                      cclog.error(err);
                      return res.json({err: err.message})
                  }
                  if(!body.gid) {

                  }
                  console.log(data);
                  // res.redirect('/topic/' + data.id);
                  res.json({id:data.id});
          })
  });

  // tiopic view by id
  app.get('/topic/:tiopicid', function(req, res, next) {
          app.services.topic.get(req.params.tiopicid, function(err, data) {
                  if(err) {return callback(err);}
                  res.send(data);
          });
  })

}
