var _ = require('lodash');
var fs = require('fs');

module.exports = function(req, res) {
  var themes = [];
  fs.readdir(
    __dirname + '/../themes',
    function(err, files) {
      if (err) {
        console.log(err);
        return;
      }
      themes = _.map(
        files,
        function(theme) {
         return {name: theme.replace('jsonresume-theme-', '')};
        }
      );
      res.json({
        themes: themes
      });
    }
  );
};
