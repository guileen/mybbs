
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
var helpers = require('./routes/helpers');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
if('test' != app.get('env'))
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
app.use(helpers.dynamicContext);
app.use(helpers.timeout(1000));
app.use(app.router);
app.use(require('less-middleware')({ src: path.join(__dirname, 'public')
    , debug: true
    , paths: [path.join(__dirname, 'public/less')]
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'bower_components')));

app.locals({
    hello: 'world'
});

if ('test' == app.get('env')) {
    app.use(function(err, req, res, next) {
            res.error = err;
            next(err);
    })
}
// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// init mqhub
var mqhub = require('./mqhub');
global.mqhub = mqhub.MQHub(mqhub.MemMQ());

// init service.
var redis = require('redis');
var services = require('./lib/services');
var redisClient = redis.createClient(config.port, config.host);
services.init(redisClient);
redisClient.select(config.database, function(err) {
        if(err) throw err;
})

routes(app);

var server = exports.server = http.createServer(app);
exports.app = app;
exports.spserver = require('./websocket')(server);
if(!module.parent) {
  server.listen(app.get('port'), function(){
      console.log('Express server listening on port ' + app.get('port'));
  });
}
