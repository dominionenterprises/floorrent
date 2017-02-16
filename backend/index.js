var http = require("http")
var express = require("express")
var app = express()
app.use(express.static(__dirname + "/"));
var port = process.env.PORT || 5000;
var server = http.createServer(app);
server.listen(port);
var path = require('path');

app.get('/', function (req, res) {
  res.sendFile(path.resolve(__dirname + '/frontend/index.html'));
});

