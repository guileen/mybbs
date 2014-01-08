module.exports = function(app) {

  // group view by slug url
  app.get('/g/:group', function(req, res, next) {
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
