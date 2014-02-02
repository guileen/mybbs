// an abstract highlevel protocol layer of pubsub, handle object message.
// This layer is write for refactor
// Help me switch the MQ from in-mem, redis, or zmq.
function MemMQ() {
    var mq = {
        pub: pub
      , sub: sub
      , unsub: unsub
    };
    var subChannels = {};
    function pub(key, message) {
        if(subChannels[key] && mq.onmessage)
            mq.onmessage(key, message);
    }

    function sub(key) {
        subChannels[key] = true;
    }

    function unsub(key) {
        subChannels[key] = false;
    }
    return mq;
}

function RedisMQ(redisClient) {
    var mq = {
        pub: pub
      , sub: sub
      , unsub: unsub
    }
    // TODO
}

function MQHub(mq) {
    var channelClients = {};

    function getChannelClients(channel) {
        return channelClients[channel] || (channelClients[channel] = [])
    }

    function sub(channel, client) {
        var clients = getChannelClients(channel);
        if(clients.length == 0) {
            mq.sub(channel);
        }
        // TODO optimized, indexOf is slow when client is too much
        if(clients.indexOf(client) === -1) {
            clients.push(client);
        }
    }

    function unsub(channel, client) {
        var clients = getChannelClients(channel);
        var index = clients.indexOf(client);
        clients.splice(index, 1);
        if(clients.length == 0) {
            channelClients[channel] = null;
            mq.unsub(channel);
        }
    }

    function pub(channel, message) {
        mq.pub(channel, message);
    }

    function getPubsub() {
        return Pubsub(hub);
    }

    mq.onmessage = function(channel, message) {
        var clients = channelClients[channel];
        if(clients) {
            for (var i = 0, l = clients.length; i < l; i ++) {
                var c = clients[i];
                c.onmessage(channel, message)
            }
        }
    }

    var hub = {
        pub: pub
      , sub: sub
      , unsub: unsub
      , getPubsub: getPubsub
    }
    return hub;
}

function Pubsub(hub) {
    var channels = [];
    var client = {
        sub: sub
      , unsub: unsub
      , pub: pub
      , release: release
    };

    function sub(channel) {
        channels.push(channel);
        hub.sub(channel, client);
    }

    function unsub(channel) {
        hub.unsub(channel, client);
    }

    function pub(channel, message) {
        hub.pub(channel, message);
    }

    function release() {
        for (var i = 0, l = channels.length; i < l; i ++) {
            var c = channels[i];
            hub.unsub(c, client);
        }
    }
    return client;
}


exports.MemMQ = MemMQ;
exports.RedisMQ = RedisMQ;
exports.MQHub = MQHub;
