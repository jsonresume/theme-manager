var theme = require('./lib/theme');
var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');
var app = express();
var minify = require('express-minify');
var compress = require('compression');

app.disable('x-powered-by');
app.use(compress());
app.use(minify(
{
  cache: __dirname + '/cache'
}));

app.use(bodyParser.json())
app.use(cors());

app.use("/themes.json", express.static('themes.json'));
app.get('/:theme', theme);
app.post('/:theme', theme);

app.get('/theme/:theme', theme);
app.post('/theme/:theme', theme);

app.listen(3000);

console.log("Starting theme-manager..");
console.log('Server is now running at http://localhost:3000/');
