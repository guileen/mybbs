var config = require('./config');
var redis = require('redis');
var service = require('../lib/services');
var redisClient = redis.createClient(config.port, config.host);

exports.service = service(redisClient);

before(function(done){
        redisClient.select(config.database, function(err) {
                redisClient.flushdb(done);
        });
})

after(function(done){
        redisClient.flushdb(done);
})
