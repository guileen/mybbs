function autoValidate(form) {
  if(typeof form == 'string') form = u.q(form);
  u.s('.form-group', form).forEach(function(group) {
      u.s('input, textarea', group).forEach(function(input) {
          function check(e) {
              console.log(e);
              if(input.checkValidity()) {
                u.removeClass(group, 'has-error');
                e && u.addClass(group, 'has-success');
              } else {
                u.removeClass(group, 'has-success');
                u.addClass(group, 'has-error');
              }
          }
          input.addEventListener('input', check);
          input.addEventListener('blur', function(e) {
                u.removeClass(group, 'has-success');
          });
          check();
      })
  })
}
