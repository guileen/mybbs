function fixedAlert(msg, name) {
  var container = u.q('#alertContainer');
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

function makeWSClient() {
    var ws = new WebSocket('ws://dev:3000');
    ws.onopen = function() {
        client.onopen && client.onopen();
    }
    ws.onmessage = function(e) {
        client.emit(JSON.parse(e.data));
    }
    var client = ProtocolHandler();
    client.send = function(msg) {
        ws.send(JSON.stringify(msg));
    }
    return client;
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
