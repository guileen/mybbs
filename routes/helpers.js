exports.dynamicContext = function(req, res, next) {
    // must before routes
    var user = req.session.user;
    res.locals.user = res.locals.loginUser = user;
    res.locals.hasLogin = !!user;
    next();
}

exports.timeout = function(time) {
    return function(req, res, next) {
        var timer = setTimeout(function(){
                if(!res.headersSent)
                    res.writeHead(500, 'Timeout');
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
