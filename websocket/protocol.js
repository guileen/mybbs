(function(exports) {

var CODE_SUB = 1
  , CODE_UNSUB = 2
  , CODE_PUB = 3
  , CODE_REQ = 4
  , CODE_RES = 5
  , CODE_ERR = 6
  , CODE_BAD_REQ = 7
  , ERR_NOT_OPEN = 'NOTOPEN'
  ;

exports.ProtocolHandler = function ProtocolHandler() {
    var client = {
        pub: pub
      , sub: sub
      , unsub: unsub
      , req: req
      , badreq: badreq
      , emit: emit
      , open: false
    };
    var reqid = 1;
    var callbacks = new Array(255);
    function emit(data) {
        var code = data[0];
        data = data[1];
        switch(code) {
          case CODE_SUB:
            client.onsub(data);
            break;
          case CODE_UNSUB:
            client.onunsub(data);
            break;
          case CODE_PUB:
            // subscribed message
            client.onpub(data[0], data[1]);
            break;
          case CODE_REQ:
            var id = data[0];
            data[1].push(function response(err, data) {
                    if(id) {
                        if(err) {
                            console.error('error:' + (err && err.stack));
                            client.send([CODE_ERR, [id]]);
                        } else {
                            client.send([CODE_RES, [id, data]]);
                        }
                    }
            });
            client.onreq.apply(null, data[1]);
            break;
          case CODE_RES:
            // response
            var id = data[0];
            callbacks[id](null, data[1]);
            callbacks[id] = null;
            break;
          case CODE_BAD_REQ:
            throw new Error('unknow request method');
          default:
            throw new Error('unknow code:' + data[0]);
        }
    }

    function sub(channel) {
        client.send([CODE_SUB, channel]);
    }

    function unsub(channel) {
        client.send([CODE_UNSUB, channel]);
    }

    function pub(channel, message) {
        client.send([CODE_PUB, [channel, message]])
    }

    function req() {
        var args = Array.prototype.slice.call(arguments);
        var cb, id = -1;
        if(typeof args[args.length - 1] == 'function') {
            cb = args.pop();
            if(!client.open) return cb(ERR_NOT_OPEN);
            id = reqid ++;
            if(reqid > 255) reqid = 1;
            callbacks[id] = cb;
        }
        client.send([CODE_REQ, [id, args]]);
    }

    function badreq(id, err) {
        client.send([CODE_BAD_REQ, [id, err]]);
    }

    return client;
}

})(typeof exports == 'undefined' ? window : exports);
