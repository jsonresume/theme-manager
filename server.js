var express = require('express');
var request = require('superagent');
var fs = require('fs');
var mkdirp = require('mkdirp');
var path = require('path');
var npm = require("npm");
var npmi = require('npmi');
var tarball = require('tarball-extract')
var exec = require('child_process').exec,
  child;
var app = express();
var themeDir = 'themes';
var demo = JSON.parse(fs.readFileSync('resume.json', 'utf8'));

function runTheme(options, req, res) {
  console.log('Generating HTML');
  var themeDirectory = options.themeDirectory;
  console.log('hey', themeDirectory)
  var theme = require(__dirname +'/'+ themeDirectory);
  if (theme.render) {
    res.send(theme.render(demo));
  } else {
    res.send('Theme error!')
  }
}

app.get('/theme/:theme', function(req, res) {
  var theme = req.params.theme;
  var version = '0';
  var versionCheck = theme.split('@');
  if (versionCheck.length > 1) {
    theme = versionCheck[0];
    version = versionCheck[1];
  }

  var directoryFolder = path.join(themeDir, theme, version);

  console.log(theme, version);
  console.log('why ont execute');
  fs.exists(directoryFolder, function(exists) {
    console.log(directoryFolder, exists);
    if (exists && version !== '0') {
      console.log('Theme cached');
      runTheme({
        themeDirectory: directoryFolder
      }, req, res);
      return;
    } else {
      console.log('Chceking NPM');
      request.get('https://registry.npmjs.org/' + theme, function(response) {

        var lib = response.body;
        if (version === '0') {
          version = lib['dist-tags'].latest;
        }

        var directoryFolder = path.join(themeDir, theme, version);
        fs.exists(directoryFolder, function(exists) {
          if (exists) {
            runTheme({
              themeDirectory: directoryFolder
            }, req, res);
            return;
          } else {
            console.log(directoryFolder);
            var tarballURL = lib.versions[version].dist.tarball;
            console.log(tarballURL);
            var themeVersion = theme + '@' + version;

            mkdirp(directoryFolder, function(err) {
              var tempExtractPath = __dirname + '/tmp/' + themeVersion;
              console.log('Downloading NPM module');
              tarball.extractTarballDownload(tarballURL, __dirname + '/tmp/' + themeVersion + '.tar.gz', tempExtractPath, {}, function(err, result) {
                fs.readdir(tempExtractPath, function(err, files) {
                  var containingFolder = files[0];
                  fs.rename(path.join(tempExtractPath, containingFolder), directoryFolder, function() {
                    console.log('Installing dependencies');
                    child = exec('cd ' + directoryFolder + ' && npm install',
                      function(error, stdout, stderr) {

                        runTheme({
                          themeDirectory: directoryFolder
                        }, req, res);
                        if (error !== null) {
                          console.log('exec error: ' + error);
                        }
                      });
                  });
                })
              })
            });
          }
        });

      });
      // Do something
    }

  });
});
console.log('what');
app.listen(3000);
