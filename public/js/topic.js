function onDomReady() {
  var inputText = u.q('#inputText')
  u.q('#btn-showcomment').onclick=function showComment(e) {
    e.preventDefault();
    inputText.focus();
  }
  inputText.onfocus = function() {
    u.addClass(u.q('#fixed-buttons'), 'hide');
    u.addClass(u.q('.bottom-padding'), 'hide');
    if(showIntpuTimer) clearTimeout(showIntpuTimer);
  }
  var showIntpuTimer;
  inputText.onblur = function() {
    showIntpuTimer = setTimeout(function(){
        u.removeClass(u.q('#fixed-buttons'), 'hide');
        u.removeClass(u.q('.bottom-padding'), 'hide');
    }, 500);
  }
  u.jsonForm('#commentform', '#sendbtn', function(err, reply) {
      console.log(err);
      console.log(reply);
  });

  window.wsclient = makeWSClient();
  wsclient.onopen = function() {
      var pubkey = 't.'+tid+'.reply';
      wsclient.sub(pubkey);
      wsclient.onpub = function(key, reply) {
        if(key == pubkey){
          getAsync('u', reply.uid, 24*3600*1000, function(uinfo) {
              u.html('<p><a>#' + reply.rid + '</a>&nbsp;<a>' + uinfo.nickname + '</a>: '+reply.txt+'</p>', '#reply-container');
              var input = u.q('#inputText');
              input.value = '';
              input.focus();
              window.scroll(0, 10000)
          })
        }
      }
      // setTimeout(function() {
      //     wsclient.unsub('hello');
      // }, 10000);
  };
}
