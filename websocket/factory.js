// client is an abstract layer of client connection, not only hold a connection, also could handle reconnection of same client.
// client has an id. when client reconnect, use the client id get the client instance again.

// LRU pool.
var LRUCache = require('./lrucache')
var ProtocolHandler = require('./protocol').ProtocolHandler;

function ClientFactory() {
    // TODO careful about memory leak.
    var clients = {};
    var releasedClients = {};
    var releasedIds = [];
    function getClient(id) {
        var client = releasedClients[id];
        if(client) {
            clients[id] = client;
        } else {
            client = clients[id];
        }
        if(!client) {
            client = makeClient(id);
            clients[id] = client;
        }
        return client;
    }

    function releaseClient(id) {
        if(!releaseClient[id])
            releasedIds.unshift(id);
        clients[id].unref();
        releaseClient[id] = clients[id];
        clients[id] = null; // delete
    }

    function gc() {
        while(releasedIds.length > 5000) {
            var id = releasedIds.pop();
            releasedClients[id] = null;
        }
    }

    return {
        getClient: getClient
      , releaseClient: releaseClient
      , gc: gc
    }
}

var clientFactory = new ClientFactory();

function makeClient(id) {
    var client = ProtocolHandler();
    client.id = id;
    client.cache = new LRUCache();
    client.onsub = function(channel) {
        client.pubsub.sub(channel);
    }
    client.onunsub = function(channel) {
        client.pubsub.unsub(channel);
    }
    client.onpub = function(channel, message) {
    }
    client.init = function() {
        if(!client.pubsub) {
            client.pubsub = mqhub.getPubsub();
            client.pubsub.onmessage = function(key, message) {
                if(message.type != 'internal') {
                    client.pub(key, message);
                }
            }
        }
    }
    client.unref = function() {
        client.pubsub.release();
        client.pubsub = null;
    }
    client.init();
    return client;
}

module.exports = clientFactory;
