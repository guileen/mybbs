var http = require('http');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

function MockSocket(){
    EventEmitter.call(this);
}
util.inherits(MockSocket, EventEmitter);

MockSocket.prototype.destroy = function() {

}


function MockRequest(url, method){
    EventEmitter.call(this);
    this.url = url;
    this.method = method || 'GET';
    this.headers = {};
    this.socket = new MockSocket();
    this.connection = {}; // TODO
}
util.inherits(MockRequest, EventEmitter);

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

var server = require('../app');
exports.request = function(method, url, header, callback) {
    if(!callback && typeof header == 'function') {
        callback = header;
        header = {};
    }
    var req = new MockRequest(url, method);
    var res = new MockResponse();
    server.emit('request', req, res);
    res.on('finish', function(){
            if(res.statusCode > 400) {
                return callback(new Error('Status: res.statusCode' + res.statusMessage), req, res);
            }
            callback(null, req, res);
    })
}
exports.get = exports.request.bind(exports, 'get');
exports.post = exports.request.bind(exports, 'post');


