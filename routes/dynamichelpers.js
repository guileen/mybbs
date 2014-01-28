module.exports = function(req, res, next) {
    // must before routes
    var user = req.session.user;
    res.locals.user = res.locals.loginUser = user;
    res.locals.hasLogin = !!user;
    next();
    var timer = setTimeout(function(){
        // res.writeHead(500, 'Timeout');
        res.end('Timeout');
    }, 1000);
    res.on('finish', function() {
        // on finish
        clearTimeout(timer);
    })
}
