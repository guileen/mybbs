var config = require('../config');
var common = require('../common/common')
var groupdao = require('../lib/services/groupdao');
exports.dynamicContext = function(req, res, next) {
    // must before routes
    var user = req.session.user;
    res.locals.user = res.locals.loginUser = user;
    res.locals.hasLogin = !!user;
    res.locals.baseUrl = config.baseUrl;
    next();
}

exports.timeout = function(time) {
    return function(req, res, next) {
        var timer = setTimeout(function(){
                if(!res.headersSent)
                    res.writeHead(408, 'Request Timeout');
                res.end('Timeout');
        }, time);
        res.on('finish', function() {
                // on finish
                clearTimeout(timer);
        })
        next();
    }
}

exports.requireLogin = function(req, res, next) {
    if(!req.session.user) {
        var url = req.url;
        return res.redirect('/signin?lasturl='+encodeURIComponent(url));
    }
    next();
}

exports.initGroup = function(req, res, next) {
  var gid = req.params.gid;
  var user = req.session.user;
  groupdao.getGroup(gid, function(err, group) {
      if(err) throw err;
      if(!group) {
        res.send(404, 'Not such group');
      }
      groupdao.isMember(user && user.id, gid, function(err, isMember) {
          if(err) throw err;
          if(group.privacy == common.PRIVACY_TEAM && !isMember) {
            return res.send(403, 'Only allow member access');
          }
          res.locals.group = group;
          res.locals.isMember = isMember;
          next();
      })
  })
}

exports.requireMember = function(req, res, next) {
  if(!res.locals.isMember) {
    return res.send(403, 'Only allow member access');
  }
  next();
}
