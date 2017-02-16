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

// serve static files from public
app.use(express.static('public'));

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

/* User Resource */
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
      uuid = result.rows[0].uuid;
      bcrypt.compare(password, hashedPass, function(err, result) {
        if (result){
          res.send({status:200, message:{access:access, uuid:id}})
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


/* Floorplan Resource */
app.get("/floorplan/:id/", function(req, res){
  id = parseInt(req.params.id);
  pool.connect(function(err, client, done) {
    if(err) {
      return console.error('error fetching client from pool', err);
    }
    client.query("SELECT * FROM floorplans WHERE fpid=$1", [id], function(err, result) {
      if(err) {
        return console.error('error running query', err);
      }
      if (result.rows.length != 1){
        res.send({status:400, message: "Floorplan ID " + id.toString() + " not found"});
        return;
      }
      res.send(result.rows[0]);
    });
  });
});

app.get("/floorplan", function(req, res){
  creator = parseInt(req.query.creator);
  pool.connect(function(err, client, done) {
    if(err) {
      return console.error('error fetching client from pool', err);
    }
    if (creator){
      query = "SELECT * FROM floorplans WHERE creator=$1";
      params = [creator];
    } else {
      query = "SELECT * FROM floorplans";
      params = [];
    }
    client.query(query, params, function(err, result) {
      if(err) {
        return console.error('error running query', err);
      }
      if (result.rows.length == 0){
        res.send({status:400, message: "No floorplans found"});
        return;
      }
      res.send(result.rows);
    });
  });
});

app.post("/floorplan/", function(req, res){
  creator = req.body.creator;
  pool.connect(function(err, client, done) {
    if(err) {
      return console.error('error fetching client from pool', err);
    }
    client.query("INSERT INTO floorplans (fpid, creator) VALUES(DEFAULT, $1) RETURNING fpid", [creator], function(err, result) {
      if(err) {
        return console.error('error running query', err);
      }
      res.send(result.rows[0]);
    });
  });
});

app.post("/floorplan/:id", function(req, res){
  content = req.body.content;
  id = parseInt(req.params.id);
  pool.connect(function(err, client, done) {
    if(err) {
      return console.error('error fetching client from pool', err);
    }
    client.query("UPDATE floorplans SET content=$1 WHERE fpid=$2", [content, id], function(err, result) {
      if(err) {
        return console.error('error running query', err);
      }
      res.send(result);
    });
  });
});

app.delete("/floorplan/:id", function(req, res){
  uuid = req.body.uuid;
  id = parseInt(req.params.id);
  pool.connect(function(err, client, done) {
    if(err) {
      return console.error('error fetching client from pool', err);
    }
    client.query("WITH a AS (DELETE FROM floorplans WHERE fpid=$1 AND creator=$2 returning 1) SELECT COUNT(*) from a", [id, uuid], function(err, result) {
      if(err) {
        return console.error('error running query', err);
      }
      if (result.rows[0].count != "0"){
        res.send({status:200, message:"Delete successful"});
      } else {
        res.send({status:403, message:"Delete unsuccessful"});
      }
    });
  });
});


/* Layout Resource*/
app.get("/layout/:id/", function(req, res){
  id = parseInt(req.params.id);
  pool.connect(function(err, client, done) {
    if(err) {
      return console.error('error fetching client from pool', err);
    }
    client.query("SELECT * FROM layouts WHERE lid=$1", [id], function(err, result) {
      if(err) {
        return console.error('error running query', err);
      }
      if (result.rows.length != 1){
        res.send({status:400, message: "Layout ID " + id.toString() + " not found"});
        return;
      }
      res.send(result.rows[0]);
    });
  });
});

app.get("/layout", function(req, res){
  creator = parseInt(req.query.creator);
  pool.connect(function(err, client, done) {
    if(err) {
      return console.error('error fetching client from pool', err);
    }
    if (creator){
      query = "SELECT * FROM layouts WHERE creator=$1";
      params = [creator];
    } else {
      query = "SELECT * FROM layouts";
      params = [];
    }
    client.query(query, params, function(err, result) {
      if(err) {
        return console.error('error running query', err);
      }
      if (result.rows.length == 0){
        res.send({status:400, message: "No layouts found"});
        return;
      }
      res.send(result.rows);
    });
  });
});

app.post("/layout/", function(req, res){
  creator = req.body.creator;
  fpid = req.body.fpid;
  pool.connect(function(err, client, done) {
    if(err) {
      return console.error('error fetching client from pool', err);
    }
    client.query("INSERT INTO layouts (lid, creator, fpid) VALUES(DEFAULT, $1, $2) RETURNING lid", [creator, fpid], function(err, result) {
      if(err) {
        return console.error('error running query', err);
      }
      res.send(result.rows[0]);
    });
  });
});

app.post("/layout/:id", function(req, res){
  content = req.body.content;
  id = parseInt(req.params.id);
  pool.connect(function(err, client, done) {
    if(err) {
      return console.error('error fetching client from pool', err);
    }
    client.query("UPDATE layouts SET content=$1 WHERE lid=$2", [content, id], function(err, result) {
      if(err) {
        return console.error('error running query', err);
      }
      res.send(result);
    });
  });
});

app.delete("/layout/:id", function(req, res){
  uuid = req.body.uuid;
  id = parseInt(req.params.id);
  pool.connect(function(err, client, done) {
    if(err) {
      return console.error('error fetching client from pool', err);
    }
    client.query("WITH a AS (DELETE FROM layouts WHERE lid=$1 AND creator=$2 returning 1) SELECT COUNT(*) from a", [id, uuid], function(err, result) {
      if(err) {
        return console.error('error running query', err);
      }
      if (result.rows[0].count != "0"){
        res.send({status:200, message:"Delete successful"});
      } else {
        res.send({status:403, message:"Delete unsuccessful"});
      }
    });
  });
});

