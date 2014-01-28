var init = require('./init');
var mock = require('./mock');
var http = require('http');

describe('app.js', function(){
        it('should 404', function(done) {
                http.ServerResponse.should.equal(mock.MockResponse);
                mock.get('/foo', function(err, req, res) {
                        res.statusCode.should.eql(404);
                        done();
                });
        })
})
