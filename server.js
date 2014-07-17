var theme = require('./lib/theme');
var themes = require('./lib/themes');
var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');
var app = express();

app.use(bodyParser.json())
app.use(cors());

app.get("/themes.json", themes);
app.get('/:theme', theme);
app.post('/theme/:theme', theme);

app.get('/theme/:theme', theme);
app.post('/theme/:theme', theme);

app.listen(3000);

console.log('Server running at http://localhost:3000/');
