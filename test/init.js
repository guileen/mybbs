process.env.NODE_ENV = 'test';
// reset config with test config.
var config = require('../config');
var test_config = require('./config');
for(var key in test_config) {
    config[key] = test_config[key];
}
// ensure http IncomingMessage and ServerResponse mocked.
require('./mock');
// ensure init the app and service
require('../app');
var services = require('../lib/services');

before(function(done){
        var redis = services.getRedisClient();
        redis.select(config.database, function(err) {
                // clean the data before test.
                redis.flushdb(done);
        });
})

// after(function(done){
//         redisClient.flushdb(done);
// })
