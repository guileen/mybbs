var userdao = require('../lib/services/userdao');
module.exports = {
  'u': function(id, res) {
    userdao.get(id, res);
  }
}
