// TODO signin verify for websocket
// TODO get websocket client by userid
// TODO subscribe topic-{tid}-comments when view that topic and subscribe group-new-topic
// TODO subscribe group-{gid}-new-topic and group-top-topics-comments when enter group
var WebSocketServer = require('ws').Server
  , SteamPunkServer = require('steampunk').SteamPunkServer
  , factory = require('./factory')
  ;

var maxid = 1;
// get the client id from request or generate one;
function getClientId(req) {
    // TODO
    return maxid ++;
}

module.exports = function(httpServer) {
    var wss = new WebSocketServer({server:httpServer, verifyClient: function(info) {
                var req = info.req;
                // generate clientid.
                console.log(req.session);
                return true;
    }});
    wss.on('connection', function(ws) {
            var id = getClientId(ws.upgradeReq);
            var client = factory.getClient(id);

            ws.on('message', function(data, flags) {
                    client.emit(JSON.parse(data));
            })
            ws.on('close', function(){
                    factory.releaseClient(id);
            })
            client.send = function(msg) {
                ws.send(JSON.stringify(msg));
            }
    })
    return wss;
}

var index = 0;
setInterval(function(){
        mqhub.pub('hello', ++index)
}, 500);
