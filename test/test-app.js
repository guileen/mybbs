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

function shouldget(path) {
    it('should get ' + path, function(done) {
            mock.get(path, done);
    })
}

function shouldpost(path, body) {
    it('should post ' + path, function(done) {
            mock.post(path, body, function(err, req, res) {
                    done(err);
            });
    })
}

describe('Guest', function(){
        shouldget('/');
        shouldget('/signin');
        shouldget('/signup');
        shouldpost('/signup', {nickname: '风清扬', password: '123456', email: 'gl@gl.com'});
        shouldpost('/signin', {email: 'gl@gl.com', password: '123456'});
});
