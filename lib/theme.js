var request = require('superagent');
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var mkdirp = require('mkdirp');
var path = require('path');
var root = path.dirname(require.main.filename);
var npm = require('npm');
var _ = require('lodash');
var npmi = require('npmi');
var tarball = require('tarball-extract')
var exec = require('child_process').exec, child;
var schema = require('resume-schema');
var resume = require('resume-schema').resumeJson;
var themeDir = 'themes';

function runTheme(options, req, res) {
  var themeDirectory = options.themeDirectory;
  console.log('Generating HTML');
  console.log('Serve', themeDirectory)

  Promise.resolve()
    .then(function () { return require(path.join(root, themeDirectory)); })
    .then(function (theme) { return theme.render(options.resume, options.themeOptions); })
    .then(function (rendered) { res.send(rendered); })
    .catch(function (error) {
      fs.readFileAsync(path.join(root, themeDirectory, 'package.json'), 'utf8').then(function (themePackageJson) {
        var output = '';
        output += 'Theme returned an error.';
        output += '<pre>';
        output += error.stack;
        output += '</pre>';
        output += '<h3>Theme Info</h3>';
        output += '<pre>';
        output += themePackageJson;
        output += '</pre>';
        output += '<p><strong>We just launched the official 0.0.0 version recently, please make sure you update before continuing.</strong></p>';
        output += '<h3>Resume.json Validation Test</h3>';
        delete options.resume._id;
        delete options.resume.jsonresume;
        delete options.resume.profiles;
        schema.validate(options.resume, function(blah, err) {
          output += '<pre>';
          output += JSON.stringify(err, undefined, 4);
          output += '</pre>';
          res.send(output)
        })
      });
    })
    .done();
};

var getTheme = function(req, res) {
  var resumeObject = _.cloneDeep(resume);
  var themeOptions = {};

  if (req.body && req.body.resume) {
    console.log('Use posted resume');
    resumeObject = req.body.resume;
  }

  if (req.body && req.body.themeOptions) {
    console.log('Use posted theme options');
    themeOptions = req.body.themeOptions;
  }

  var theme = 'jsonresume-theme-' + req.params.theme.toLowerCase();
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
        resume: resumeObject,
        themeOptions: themeOptions
      }, req, res);
      return;
    } else {
      console.log('Checking NPM');
      request.get('https://registry.npmjs.org/' + theme).end(function(error, response) {
        var lib = response.body;
        if (!lib || Object.keys(lib).length === 0 || lib.error) {
          res.send({
            message: 'Theme could not be found in the npm registry.',
            code: 'theme_not_found'
          });
          console.log(theme, 'not found');
          return;
        }

        if (version === '0') {
          version = lib['dist-tags'].latest;
        }
        try {
          var author = lib['versions'][version].author.name;
        } catch(e) {
          // ..
        }

        var directoryFolder = path.join(themeDir, theme, version);
        fs.exists(directoryFolder, function(exists) {
          if (exists) {
            runTheme({
              themeDirectory: directoryFolder,
              resume: resumeObject,
              themeOptions: themeOptions
            }, req, res);
            return;
          } else {
            if (!lib.versions[version]) {
              var msg = theme + '@' + version + ' does not exist.';
              res.send(msg);
              console.log(msg);
              return;
            }

            var themeVersion = theme + '@' + version;
            var tarballURL = lib.versions[version].dist.tarball;

            mkdirp(directoryFolder, function(err) {
              fs.exists( root + '/tmp/', function(exists) {
                if ( ! exists) {
                  // create folder /tmp to download && extract
                  mkdirp(root + '/tmp/', function(err) {
                    // handle err
                    if (err)
                      console.log('cannot create folder ' + root + '/tmp/'+'. Try creating it manually, maybe?');
                  });
                }
              });

              var tempExtractPath = root + '/tmp/' + themeVersion;
              console.log('Downloading NPM module');
              tarball.extractTarballDownload(tarballURL, root + '/tmp/' + themeVersion + '.tar.gz', tempExtractPath, {}, function(err, result) {
                fs.readdir(tempExtractPath, function(err, files) {
                  var containingFolder = files[0] || '';

                  // Save in themes.json
                  fs.readFile(path.join(root, '/themes.json'), 'utf-8', function(err, data) {
                    var name = theme.replace('jsonresume-theme-', '');
                    var themes = {
                      themes: {}
                    };
                    if (!err) {
                      try {
                        themes = JSON.parse(data);
                      } catch(e) {}
                    }
                    themes['themes'][name] = themes['themes'][name] || {
                      author: "",
                      versions: []
                    };
                    themes['themes'][name].author = author || "";
                    themes['themes'][name].versions.push(version);
                    themes['themes'][name].versions.sort();
                    var json = JSON.stringify(themes, null, '  ');
                    fs.writeFile(path.join(root, '/themes.json'), json, function(err) {
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
                          resume: resumeObject,
                          themeOptions: themeOptions
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
