var http = require('http');
var util = require('util');
var querystring = require('querystring');
var EventEmitter = require('events').EventEmitter;

function MockSocket(){
    EventEmitter.call(this);
}
util.inherits(MockSocket, EventEmitter);

MockSocket.prototype.destroy = function() {
    console.log('socket destoried')
}


function MockRequest(url, method){
    EventEmitter.call(this);
    this.url = url;
    this.method = method || 'GET';
    this.headers = {};
    this.socket = new MockSocket();
    this.connection = {}; // fix connect.session
}
util.inherits(MockRequest, EventEmitter);

MockRequest.prototype.setHeader = function(name, value) {
    this.headers[name.toLowerCase()] = value;
}

function MockResponse(){
    EventEmitter.call(this);
    this.sentcontent = '';
    this.isFinished;
    this.headers = {};
    this._removedHeader = {};
    this.output = [];
    this.outputEncodings = [];
}
util.inherits(MockResponse, EventEmitter);
MockResponse.prototype.write = function(str){
    if(this.isFinished) throw new Error('Already responsed');
    this.sentcontent += str;
}

MockResponse.prototype.end = function(str){
    if(!this.statusCode) {
        this.writeHead(200);
    }
    this.write(str);
    this.isFinished = true;
    this.emit('finish');
}

MockResponse.prototype.writeHead = function(statusCode, statusMessage, headers){
    if(typeof statusMessage == 'object' && headers === undefined) {
        headers = statusMessage;
        statusMessage = '';
    }
    this.statusCode = statusCode;
    this.statusMessage = statusMessage;
    for(var key in headers) {
        this.headers[key] = headers[key];
    }
    this.headersSent = true;
}

MockResponse.prototype.setHeader = function(name, value) {
    this.headers[name] = value;
}

MockResponse.prototype.getHeader = function(name) {
    return this.headers[name];
}

exports.req = function(url, method) {
    return new MockRequest(url, method);
}

exports.res = function() {
    return new MockResponse();
}

exports.MockRequest = MockRequest;
exports.MockResponse = MockResponse;
http.IncomingMessage = MockRequest;
http.ServerResponse = MockResponse;

exports.httpClient = function (server) {
    var cookiejar = {};
    var parseCookie = require('cookie').parse;
    function request(method, url, header, body, callback) {
        if(!callback && typeof header == 'function') {
            callback = header;
            header = {};
        }
        var req = new MockRequest(url, method);
        var res = new MockResponse();
        if(body && typeof body == 'object') {
            if(typeof body == 'object') {
                req.setHeader('Accept', 'application/json');
                req.setHeader('Content-Type', 'application/json');
                body = JSON.stringify(body);
            }
            req.setHeader('Content-Length', Buffer.byteLength(body));
        }
        var cookies = [];
        for(var key in cookiejar) {
            cookies.push(key + '=' + encodeURIComponent(cookiejar[key]));
        }
        var cookieStr = cookies.join(';');
        if(cookieStr) {
            req.setHeader('Cookie', cookieStr);
        }
        server.emit('request', req, res);
        process.nextTick(function(){
                if(body) {
                    req.emit('data', new Buffer(body));
                }
                req.emit('end');
        })
        res.on('finish', function(){
                for(var key in res.headers) {
                    res.headers[key.toLowerCase()] = res.headers[key];
                }
                var cookies = res.headers['set-cookie'];
                if(cookies) {
                    var _cookies = {};
                    function parseResCookie(cookie) {
                        cookie = parseCookie(cookie.split(';')[0]);
                        for(var key in cookie) {
                            _cookies[key] = cookie[key];
                        }
                    }
                    if(Array.isArray(cookies)) {
                        cookies.forEach(parseResCookie);
                    } else {
                        parseResCookie(cookies);
                    }
                    res.cookies = _cookies;
                    for(var key in _cookies) {
                        cookiejar[key] = _cookies[key];
                    }
                }
                callback(req, res);
        })
    }
    function get(url, callback) {
        request('GET', url, {}, null, callback);
    }
    function post(url, body, callback) {
        request('POST', url, {}, body, callback);
    }
    function clearCookies() {
        for(var key in cookiejar) {
            delete cookiejar[key];
        }
    }
    return {
        request: request
      , get: get
      , post: post
      , cookiejar: cookiejar
    }
}
