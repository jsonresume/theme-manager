var request = require('superagent');
var fs = require('fs');
var mkdirp = require('mkdirp');
var path = require('path');
var root = path.dirname(require.main.filename);

var tarball = require('tarball-extract')
var exec = require('child_process').exec, child;
var schema = require('resume-schema');
var themeDir = 'themes';
var installCache = {};

// Loads a resume into the system using node's require function
//
// This is incredibly unsafe.
//
// It should be replaced with something that renders the resume
// using more restrictive permissions
var performUnsafeRender = function(themePath, data, cb) {
  try {
    var theme = require(themePath);
    var render = theme.render(data);

    if (typeof render !== 'undefined') {
      cb(null, render);
    }
    else {
      cb(new Error('Theme did not return a string'));
    }
  }
  catch (err) {
    cb(err);
  }
};

// Renders a resume, swallowing common errors and returning html
var getRenderHtml = function(options, cb) {
  var themeDirectory = options.themeDirectory;

  console.log('Rendering: ' + themeDirectory);

  performUnsafeRender(
    path.join(root, themeDirectory),
    options.resume,
    function(renderError, render) {
      if (!renderError) {
        return cb(null, render);
      }
      else {
        fs.readFile(
          path.join(root, themeDirectory, 'package.json'),
          'utf8',
          function(error, themePackageJson) {
            if (error) {
              return cb(error);
            }

            var output = [
              'Theme returned an error.',
              '<pre>',
              renderError.stack,
              '</pre>',
              '<h3>Theme Info</h3>',
              '<pre>',
              themePackageJson,
              '</pre>',
              '<p><strong>We just launched the official 0.0.0 version recently, please make sure you update before continuing.</strong></p>',
              '<h3>Resume.json Validation Test</h3>'
            ].join('');

            delete options.resume._id;
            delete options.resume.jsonresume;
            delete options.resume.profiles;

            schema.validate(options.resume, function(blah, err) {
              output += '<pre>' + JSON.stringify(err, undefined, 4) + '</pre>';

              cb(null, output);
            })
          }
        );
      }
    }
  );
}

// Render the theme with the given data
var getThemeHtml = function(themeData, resumeObject, cb) {
  var directoryFolder = themeData.directory;
  var version         = themeData.version;

  if (installCache[themeData.directory]) {
    return cb(new Error('Theme is being installed'), null);
  }

  fs.exists(directoryFolder, function(exists) {
    if (exists && version !== '0') {
      getRenderHtml({ themeDirectory: directoryFolder, resume: resumeObject }, cb);
    } else {
      cb(new Error('Theme not found'), null);
    }
  });
};


// Derive the resume data from the request object
// If there is no resume in the body then we use the placeholder data
var getResumeObject = function(req) {
  if (req.body && req.body.resume) {
    return req.body.resume;
  }
  else {
    return require('resume-schema').resumeJson;
  }
};

// Download, save and install theme, then update the theme config
var downloadTheme = function(themeData, cb) {
  var directoryFolder, theme, version, author, lib;

  // Deconstruct theme data
  directoryFolder = themeData.directory;
  theme           = themeData.name;
  version         = themeData.version;
  author          = themeData.author;
  lib             = themeData.lib;

  var themeVersion = theme + '@' + version;
  var tarballURL = lib.versions[version].dist.tarball;

  mkdirp(directoryFolder, function(err) {
    fs.exists( root + '/tmp/', function(exists) {
      if ( ! exists) {
        // create folder /tmp to download && extract
        mkdirp(root + '/tmp/', function(err) {
          // handle err
          if (err)
            console.error('cannot create folder ' + root + '/tmp/'+'. Try creating it manually, maybe?');
        });
      }
    });

    var tempExtractPath = root + '/tmp/' + themeVersion;

    tarball.extractTarballDownload(tarballURL, root + '/tmp/' + themeVersion + '.tar.gz', tempExtractPath, {}, function(err, result) {
      fs.readdir(tempExtractPath, function(err, files) {
        var containingFolder = files[0];

        // Save in themes.json
        fs.readFile(path.join(root, '/themes.json'), 'utf-8', function(err, data) {
          var name = theme.replace('jsonresume-theme-', '');

          var themes = {
            themes: {}
          };

          if (!err) {
            try {
              themes = JSON.parse(data);
            }
            catch(e) {
              // ..
            }
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
            if (err) {
              return cb(err);
            }

            fs.rename(
              path.join(tempExtractPath, containingFolder),
              directoryFolder,
              function(err) {
                if (err) {
                  return cb(err);
                }

                console.log('Installing dependencies');

                // `child` is declared at the top of the file
                child = exec(
                  'cd ' + directoryFolder + ' && npm install',
                  function(error, stdout, stderr) {
                    console.log('Dependancies installed');
                    cb(error);
                  }
                );
              }
            );
          });
        });

      })
    })
  });
};

// Coalesces requests to download the same theme into a single request
// Download theme is not safe if it is called multiple times on the same theme
var installTheme = function(themeData, cb) {
  var dir = themeData.directory;

  if (!installCache[dir]) {
    console.log('"' + dir + '" being installed now');

    installCache[dir] = (function() {
      var listeners = [];

      downloadTheme(themeData, function downloadComplete(error) {
        // Remove the theme from the list of currenly installing themes
        delete installCache[dir];

        // Fire each of the callbacks
        listeners.forEach(function(listener, i) {
          listener(error);
        });

        listeners = null;
      });

      return function(onFinish) {
        listeners.push(onFinish);
      };
    })();
  }

  installCache[dir](cb);
};

// Construct a basic theme object using only the theme name
var getThemeData = function(themeName) {
  var name, version, versionCheck;

  if (/^jsonresume\-theme\-/.test(themeName)) {
    name = themeName;
  }
  else {
    name = 'jsonresume-theme-' + themeName;
  }

  version = '0';
  versionCheck = name.split('@');

  if (versionCheck.length > 1) {
    name = versionCheck[0];
    version = versionCheck[1];
  }

  var directoryFolder = path.join(themeDir, name, version);

  return {
    name: name,
    version: version,
    directory: directoryFolder,
    lib: null,
    author: null
  };
};

// Fetch the theme object from NPM
var augmentThemeData = function(themeData, cb) {
  request.get('https://registry.npmjs.org/' + themeData.name, function(response) {
    themeData.lib = response.body;

    if (!themeData.lib || Object.keys(themeData.lib).length === 0) {
      return cb(new Error('Theme could not be found in the npm registry.'));
    }

    if (themeData.version === '0') {
      themeData.version = themeData.lib['dist-tags'].latest;
    }

    if (!themeData.lib.versions[themeData.version]) {
      return cb(new Error(themeData.name + '@' + themeData.version + ' does not exist.'));
    }

    try {
      themeData.author = themeData.lib['versions'][version].author.name;
    } catch(e) {
      // ..
    }

    themeData.directory = path.join(themeDir, themeData.name, themeData.version);

    return cb(null, themeData);
  });
};

// Asynchronously process the request, returning the rendered HTML in the callback
var processRequest = function(req, cb) {
  var resumeObject = getResumeObject(req);
  var themeData    = getThemeData(req.params.theme);

  // If we already have the theme and we know the version we can render it
  // straight away
  getThemeHtml(themeData, resumeObject, function(error, html) {
    if (!error) {
      return cb(null, html);
    }

    // Otherwise we need to make a trip to NPM to get the package data
    augmentThemeData(themeData, function(error, themeData) {
      if (error) {
        return cb(error);
      }

      // Now that we know what the latest version is, we try rendering again
      getThemeHtml(themeData, resumeObject, function(error, html) {
        if (!error) {
          return cb(null, html);
        }

        // If we still don't have the theme then we download and install it
        installTheme(themeData, function(error) {
          if (error) {
            return cb(error);
          }

          // Now we almost definitely have the theme, try rending again.
          return getThemeHtml(themeData, resumeObject, cb);
        });
      });
    });
  });
};

var getTheme = function(req, res) {
  console.log('incoming request:', req.params.theme);

  processRequest(req, function(error, html) {
    if (error) {
      res.status(500).send(error.message);
    }

    res.send(html);
  });
};

module.exports = getTheme;
