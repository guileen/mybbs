var fs = require('fs')
  , path = require('path')
  , glob = require('glob')
  , RedisClient = require('redis').RedisClient
  , _slice = Array.prototype.slice
  , snippets = {}
  ;

function addScriptFolder(baseDir) {
  baseDir = path.normalize(baseDir) + '/';
  var baseDirLen = baseDir.length
    , globPath = baseDir + '**/*.lua'
    , filenames = glob.sync(globPath)
    ;
  if(filenames.length == 0) {
    console.log('no matching files found for %s', globPath);
    return;
  }
  filenames.forEach(function(filename) {
      var code = fs.readFileSync(filename, 'utf-8')
        , scriptName = filename.substring(baseDirLen, filename.length - 4).toLowerCase()
        , ret = /\s*--\s*keys\s*:\s*(\d+)\s*\n([\s\S]*)/ig.exec(code)
        , numKeys = ret ? Number(ret[1]) : 0
        ;

      if(scriptName[0] == '_') return;
      if(!ret) {
        console.log('no keys defined for %s, set to default 0 keys. example:', scriptName.toUpperCase());
        console.log('-- keys : 4')
      }

      // remove comments
      /*
      console.log('raw code')
      console.log('---------------')
      console.log(code)
      console.log('---------------')
      */

      code = code.replace(/^\s*(\-\-.*|)\n/g, '')

      /*
      console.log('cleaned lua code')
      console.log('---------------')
      console.log(code)
      console.log('---------------')
      */

      scriptName = scriptName.toLowerCase();
      snippets[scriptName] = [numKeys, code];
      RedisClient.prototype[scriptName] =
      RedisClient.prototype[scriptName.toUpperCase()] = function() {
        var args = _slice.call(arguments);
        args.unshift(numKeys);
        args.unshift(code);
        var callback = args[args.length - 1];
        if(typeof callback == 'function') {
            args[args.length - 1] = function(err, data) {
                if(err) {
                    err.message = 'scriptName:[' + scriptName + ']' + err.message;
                    console.log('args', args);
                }
                callback(err, data);
            }
        }
        this.eval.apply(this, args);
      }
  });
}

// addScriptFolder(__dirname + '/scripts');

/**
 * @param string scriptName
 * @param keys
 * @param args
 * @param callback
 */
RedisClient.prototype.extra = function(/* scriptName, keys..., args..., callback */) {
  var args = _slice.call(arguments);
  var scriptName = args.shift();
  scriptName = scriptName.toLowerCase();
  var snip = snippets[scriptName];
  args.unshift(snip[0]);
  args.unshift(snip[1]);

  var callback = args[args.length - 1];
  if(typeof callback == 'function') {
      args[args.length - 1] = function(err, data) {
          if(err) {
              err.message = 'scriptName:[' + scriptName + ']' + err.message;
              cclog.inspect('args', args);
          }
          callback(err, data);
      }
  }
  this.eval.apply(this, args);
}

exports.addScripts = addScriptFolder;
