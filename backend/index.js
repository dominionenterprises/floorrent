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

var bcrypt = require('bcrypt');
const saltRounds = 10;



pg = require('pg');
pg.defaults.ssl = true;
config = {
  user: 'rkgkfygicjqaqw',
  database: 'ddong86pr04rsv',
  password: '54bc78471776ea24cde6021d79437ecde2f717e8690d07c4088237e8ead2b3fd',
  host: 'ec2-54-235-177-45.compute-1.amazonaws.com',
  port: 5432,
  max: 10,
  idleTimeoutMillis: 30000,
};
pool = new pg.Pool(config);

app.get('/', function (req, res) {
  res.sendFile(path.resolve(__dirname + '/frontend/index.html'));
});

app.post("/login", function(req, res){
  username = req.body.username;
  password = req.body.password;
  pool.connect(function(err, client, done) {
    if(err) {
      return console.error('error fetching client from pool', err);
    }
    client.query("SELECT * FROM users WHERE username=$1", [username], function(err, result) {
      if(err) {
        return console.error('error running query', err);
      }
      if (result.rows.length != 1){
        res.send({status:400, message: "Username " + username + " not found"});
        return;
      }
      hashedPass = result.rows[0].password;
      access = result.rows[0].access;
      bcrypt.compare(password, hashedPass, function(err, result) {
        if (result){
          res.send({status:200, message:{access:access}})
        } else {
          res.send({status:403, message:"Incorrect password"});
        }
      });
    });
  });
  
});


app.post("/register", function(req, res){
  username = req.body.username;
  password = req.body.password;
  console.log(username, password);
  if (username.length < 6 || password.length < 6){
    res.send({status:400, message:"Not long enough"});
    return;
  }
  pool.connect(function(err, client, done) {
    if(err) {
      return console.error('error fetching client from pool', err);
    }
    client.query("SELECT * FROM users WHERE username=$1", [username], function(err, result) {
      if(err) {
        return console.error('error running query', err);
      }
      if (result.rows.length > 0){
        res.send({status:400, message:"Username taken"});
        return;
      }
      bcrypt.hash(password, saltRounds, function(err, hash) {
        console.log(hash.length);
        client.query("INSERT INTO users (username, password, access) VALUES($1, $2, 2)", [username, hash], function(err, result) {
          console.log("NEW USER");
          if (err) console.log(err);
          res.send(result);
        });
      });
    });
  });
});


