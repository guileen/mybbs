module.exports = function LRUCache() {
    // TODO LRU, maxsize, expire
    var cache = {};
    function get(id) {
        return cache;
    }
    function set(id, obj) {
        cache[id] = obj;
    }
    function getAsync(id, notFound, callback) {
        var obj = get(id);
        obj ? callback(null, obj) : notFound(id, callback);
    }
    function setex(id, obj, expire) {
        // TODO
    }
    return {
        get: get
      , set: set
      , getAsync: getAsync
    }
}
