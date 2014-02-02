function onDomReady() {
  var inputText = u.q('#inputText')
  function showComment(e) {
    e.preventDefault();
    inputText.focus();
  }
  inputText.onfocus = function() {
    u.addClass(u.q('#fixed-buttons'), 'hide');
    if(showIntpuTimer) clearTimeout(showIntpuTimer);
  }
  var showIntpuTimer;
  inputText.onblur = function() {
    showIntpuTimer = setTimeout(function(){
        u.removeClass(u.q('#fixed-buttons'), 'hide');
    }, 500);
  }
  u.jsonForm('#commentform', '#sendbtn', function(err, reply) {
      console.log(err);
      console.log(reply);
      u.html('<p><a>#' + reply.rid + '</a>&nbsp;<a>' + nickname + '</a>: '+reply.txt+'</p>', '#reply-container');
      var input = u.q('#inputText');
      input.value = '';
      input.focus();
      window.scroll(0, 10000)
  });

  var client = makeWSClient();
  client.onopen = function() {
      client.sub('hello');
      client.onpub = function(key, message) {
        console.log(key, message);
      }

      setTimeout(function() {
          client.unsub('hello');
      }, 10000);
  };
}
