var http = require('http');
var express = require('express');
var app = express();
app.use(express.static(__dirname + "/"));
var port = process.env.PORT || 5000;
var server = http.createServer(app);
var io = require('socket.io')(server);
server.listen(port);
var path = require('path');
var bodyParser = require('body-parser')
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

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
      done();
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
          res.send({status:200, message:{access:access, uuid:uuid}})
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
      done();
      if(err) {
        return console.error('error running query', err);
      }
      if (result.rows.length > 0){
        res.send({status:400, message:"Username taken"});
        return;
      }
      bcrypt.hash(password, saltRounds, function(err, hash) {
        console.log(hash.length);
        client.query("INSERT INTO users (uuid, username, password, access) VALUES(DEFAULT, $1, $2, 2) RETURNING uuid", [username, hash], function(err, result) {
          uuid = result.rows[0].uuid;
          if (err) console.log(err);
          res.send({status: 200, message:{uuid:uuid}});
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
      done();
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
      done();
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
  name = req.body.name;
  content = JSON.stringify(req.body.content);
  thumbnail = req.body.thumbnail;
  createFloorplan(creator, name, content, thumbnail).then(function(result) {
    res.send(result);
  });
});
function createFloorplan(creator, name, content, thumbnail) {
  return new Promise(function(resolve, reject) {
    pool.connect(function(err, client, done) {
      if(err) {
        reject(new Error('error fetching client from pool'));
      }
      client.query("INSERT INTO floorplans (fpid, creator, name, content, thumbnail) VALUES(DEFAULT, $1, $2, $3, $4) RETURNING fpid", [creator, name, content, thumbnail], function(err, result) {
        done();
        if(err) {
          reject(new Error('error running query'));
        }
        resolve(result.rows[0]);
      });
    });
  });
}

app.post("/floorplan/:id", function(req, res){
  content = JSON.stringify(req.body.content);
  icons = JSON.stringify(req.body.icons);
  labels = JSON.stringify(req.body.labels);
  name = req.body.name;
  thumbnail = req.body.thumbnail;
  id = parseInt(req.params.id);
  saveFloorplan(content, name, thumbnail, id, icons, labels).then(function(result) {
    res.send(result);
  });
});
function saveFloorplan(content, name, thumbnail, id, icons, labels) {
  return new Promise(function(resolve, reject) {
    pool.connect(function(err, client, done) {
      if(err) {
        reject(new Error('error fetching client from pool'));
      }
      client.query("UPDATE floorplans SET content=$1, name=$2, thumbnail=$3, icons=$4, labels=$5 WHERE fpid=$6", [content, name, thumbnail, icons, labels, id], function(err, result) {
        done();
        if(err) {
          reject(new Error('error running query'));
        }
        resolve(result);
      });
    });
  });
}

app.delete("/floorplan/:id", function(req, res){
  uuid = req.body.uuid;
  id = parseInt(req.params.id);
  pool.connect(function(err, client, done) {
    if(err) {
      return console.error('error fetching client from pool', err);
    }
    client.query("WITH a AS (DELETE FROM floorplans WHERE fpid=$1 AND creator=$2 returning 1) SELECT COUNT(*) from a", [id, uuid], function(err, result) {
      done();
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
      done();
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
      done();
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
      done();
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
      done();
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
      done();
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


/* socket connections  */

io.on('connection', function(socket) {
  console.log('A user connected');

  socket.on('save', function(data) {
    var content = JSON.stringify(data.content);
    var name = data.name;
    var thumbnail = data.thumbnail;
    var id = data.id;
    saveFloorplan(content, name, thumbnail, id);

    // send updates to admins
    io.sockets.emit('update', {
      content: content,
      fpid: id
    });
  });

  socket.on('create', function(data) {
    var creator = data.creator;
    var name = data.name;
    var content = JSON.stringify(data.content);
    var thumbnail = data.thumbnail;
    createFloorplan(creator, name, content, thumbnail);
  });
});

