
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var RedisStore = require('connect-redis')(express);
var config = require('./config');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session({
      store: new RedisStore({
          port: config.port
        , host: config.host
        , db: config.session_db
      })
    , secret: 'my bbs secret'
}));
app.use(require('./routes/dynamicHelpers'));
app.use(app.router);
app.use(require('less-middleware')({ src: path.join(__dirname, 'public') }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'bower_components')));

app.locals({
    hello: 'world'
});


// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// init service.
var redis = require('redis');
var services = require('./lib/services');
var redisClient = redis.createClient(config.port, config.host);
redisClient.select(config.database, function(err) {
    app.services = services(redisClient);
})

routes(app);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
