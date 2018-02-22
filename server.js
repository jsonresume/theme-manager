#!/usr/bin/env node

var theme = require('./lib/theme');
var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');
var app = express();
var minify = require('express-minify');
var compress = require('compression');
var port = process.env.PORT || 3000;

app.disable('x-powered-by');
app.use(compress());
app.use(minify(
{
  cache: __dirname + '/cache'
}));

app.use(function(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  next();
});

app.get('/ping', function(req,res,next) {
  res.send('OK');
});

// Redirect if not HTTPS
app.use(function (req,res,next) {
  if (req.header('x-https-protocol') // Nginx
    || req.header('x-forwarded-proto') === 'https' // AWS ELB
  ) {
    next();
    return;
  }
  res.redirect('https://' + req.get('host') + req.originalUrl);
});

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}));
app.use(cors());

app.set('views', __dirname + '/views');
app.engine('handlebars', require('express-handlebars')({}));
app.set('view engine', 'handlebars');

app.get('/', function(req,res,next) {
  res.send('JSON Resume Theme Server');
});

app.use("/themes.json", express.static('themes.json'));
app.get('/blank.html', function(req,res,next) {
  res.send("");
});
app.get('/:theme', theme);
app.post('/:theme', theme);

app.get('/theme/:theme', theme);
app.post('/theme/:theme', theme);

console.log("Starting theme-manager..");

app.listen(port, function() {
  console.log('Server is now running at http://localhost:' + port + '/');
});
