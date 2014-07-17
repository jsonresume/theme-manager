var request = require('superagent');
var fs = require('fs');
var mkdirp = require('mkdirp');
var path = require('path');
var root = path.dirname(require.main.filename);
var npm = require('npm');

var npmi = require('npmi');
var tarball = require('tarball-extract')
var exec = require('child_process').exec,
  child;

var resume = require('resume-schema').resumeJson;
var themeDir = 'themes';

function runTheme(options, req, res) {
  var themeDirectory = options.themeDirectory;
  console.log('Generating HTML');
  console.log('Serve', themeDirectory)

  try {
    var theme = require( path.join(root, themeDirectory) );
    var render = theme.render(options.resume);
  } catch(e) {
    // ..
  }

  if (typeof render !== 'undefined') {
    res.send(render);
  } else {
    res.send('Theme returned an error.');
  }
};

var getTheme = function(req, res) {
  var resumeObject = resume;

  if (req.body && req.body.resume) {
    console.log('Use posted resume');
    resumeObject = req.body.resume;
  }

  var theme = 'jsonresume-theme-' + req.params.theme;
  var version = '0';
  var versionCheck = theme.split('@');
  if (versionCheck.length > 1) {
    theme = versionCheck[0];
    version = versionCheck[1];
  }

  var directoryFolder = path.join(themeDir, theme, version);

  console.log(theme, version);
  fs.exists(directoryFolder, function(exists) {
    console.log(directoryFolder, exists);
    if (exists && version !== '0') {
      console.log('Theme cached');
      runTheme({
        themeDirectory: directoryFolder,
        resume: resumeObject
      }, req, res);
      return;
    } else {
      console.log('Checking NPM');
      request.get('https://registry.npmjs.org/' + theme, function(response) {
        var lib = response.body;
        if (!lib || Object.keys(lib).length === 0) {
          res.send('Theme could not be found in the npm registry.');
          console.log(theme, 'not found');
          return;
        }
        if (version === '0') {
          version = lib['dist-tags'].latest;
        }

        var directoryFolder = path.join(themeDir, theme, version);
        fs.exists(directoryFolder, function(exists) {
          if (exists) {
            runTheme({
              themeDirectory: directoryFolder,
              resume: resumeObject
            }, req, res);
            return;
          } else {
            console.log(directoryFolder);
            var tarballURL = lib.versions[version].dist.tarball;
            console.log(tarballURL);
            var themeVersion = theme + '@' + version;

            mkdirp(directoryFolder, function(err) {
              fs.exists( root + 'tmp/', function(exists) {
                if ( ! exists) {
                  // create folder /tmp to download && extract
                  mkdirp(root + 'tmp/', function(err) {
                    // handle err
                    if (err)
                      console.log('cannot create folder ' + root + 'tmp/'+'. Try creating it manually, maybe?');
                  });
                }
              });

              var tempExtractPath = root + 'tmp/' + themeVersion;
              console.log('Downloading NPM module');
              tarball.extractTarballDownload(tarballURL, root + 'tmp/' + themeVersion + '.tar.gz', tempExtractPath, {}, function(err, result) {
                fs.readdir(tempExtractPath, function(err, files) {
                  var containingFolder = files[0];

                  // Save in themes.json
                  var themes = {themes: {}};
                  fs.readFile(path.join(root, 'themes.json'), 'utf-8', function(err, data) {
                    if (!err) {
                      try {
                        themes = JSON.parse(data);
                      } catch(e) {
                        // ..
                      }
                    }
                    themes.themes[theme] = version;
                    var json = JSON.stringify(themes, null, '  ');
                    fs.writeFile(path.join(root, 'themes.json'), json, function(err) {
                      if (!err) {
                        console.log('Updated themes.json');
                      }
                    });
                  });

                  fs.rename(path.join(tempExtractPath, containingFolder), directoryFolder, function() {
                    console.log('Installing dependencies');
                    child = exec('cd ' + directoryFolder + ' && npm install',
                      function(error, stdout, stderr) {
                        runTheme({
                          themeDirectory: directoryFolder,
                          resume: resumeObject
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
    }
  });
};

module.exports = getTheme;
