function makeWSClient() {
    var ws = new WebSocket('http://dev:3000');
    ws.onmessage = function(e) {
        client.emit(JSON.parse(e.data));
    }
    var client = ProtocolHandler();
    client.send = function(msg) {
        ws.send(JSON.stringify(msg));
    }
    return client;
}
