var http = require("http");
var express = require("express");
var app = express();
app.use(express.static(__dirname + "/"));
var port = process.env.PORT || 5000;
var server = http.createServer(app);
server.listen(port);
var path = require('path');
var bodyParser = require('body-parser')
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', function (req, res) {
  res.sendFile(path.resolve(__dirname + '/frontend/index.html'));
});

app.post("/login", function(req, res){
  username = req.body.username;
  password = req.body.password;
});
