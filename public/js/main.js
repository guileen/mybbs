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
      window.onPageLoad && window.onPageLoad()
    }

    function initShowNavBtn() {
      // mobile nav button
      var btnShowNav = u.q('#btn-shownav');
      var btnShowNavIcon = u.q('#btn-shownav-icon');
      if(btnShowNav) {
        FastClick.attach(btnShowNav);
        btnShowNav.ontouchend = function() {
          log('touchend' + Date.now());
        }
        btnShowNav.onclick = function() {
          log('click' + Date.now());
          u.toggleClass(document.body, 'shownav');
          u.toggleClass(btnShowNavIcon, 'glyphicon-th-list');
          u.toggleClass(btnShowNavIcon, 'glyphicon-remove');
        }
      }
    }
    exports.main = main;
})(window);
