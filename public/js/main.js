function fixedAlert(msg, name) {
  var container = u.q('#alertContainer');
  if(!container) {
    container = u.html('<div id="alertContainer" class="text-center" style="position:fixed;top:3px;left:5px;right:5px;"></div>', document.body, 1);
  }
  var result = u.html('<div class="alert alert-' + name + '">' + msg + '</div>', container);
  setTimeout(function(){
      container.removeChild(result);
  }, 3000);
}
function alertSuccess(msg) {
  return fixedAlert(msg, 'success');
}
function alertInfo(msg) {
  return fixedAlert(msg, 'info');
}
function alertWarn(msg) {
  return fixedAlert(msg, 'warn');
}
function alertError(msg) {
  return fixedAlert(msg, 'danger');
}

// get from local or cache, ttl(time to live) is optional
function getAsync(type, id, ttl, callback) {
    if(!callback) {
        callback = ttl;
        ttl = 0;
    }
    var key = type+'/'+id;
    var v = u.get(key);
    v && (ttl && v._t + ttl < Date.now() || !ttl)
      ? callback(v)
      : wsclient.req(type, id, function(err, data) {
              if(err && !v) throw err;
              data && u.set(key, data);
              callback(data || v);
      })
}

function makeWSClient() {
    var ws = new WebSocket('ws://dev:3000');
    ws.onopen = function() {
        wsclient.onopen && wsclient.onopen();
        wsclient.open = true;
    }
    ws.onmessage = function(e) {
        wsclient.emit(JSON.parse(e.data));
    }
    window.wsclient = ProtocolHandler();
    wsclient.send = function(msg) {
        ws.send(JSON.stringify(msg));
    }
    return wsclient;
}

(function(exports) {
    function log(txt) {
      var el = u.q('#logger');
      if(el) {
        el.value += txt + '\n';
        el.scrollTop = 100000;
      }
      console.log(txt);
    }
    function main() {
      initShowNavBtn();
      window.onDomReady && window.onDomReady()
    }

    function initShowNavBtn() {
      // mobile nav button
      var btnShowNav = u.q('#btn-shownav');
      var btnShowNavIcon = u.q('#btn-shownav-icon');
      var cover = u.q('.sidenav-cover');
      function toggleNav() {
          u.toggleClass(document.body, 'shownav');
          u.toggleClass(btnShowNavIcon, 'glyphicon-th-list');
          u.toggleClass(btnShowNavIcon, 'glyphicon-remove');
      }
      if(btnShowNav) {
        FastClick.attach(btnShowNav);
        btnShowNav.onclick = toggleNav;
        FastClick.attach(cover);
        cover.onclick = toggleNav;
      }
    }
    exports.main = main;
    exports.localStorage = localStorage || {};
})(window);
