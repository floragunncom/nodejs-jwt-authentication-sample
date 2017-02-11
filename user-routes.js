var express = require('express'),
    _       = require('lodash'),
    config  = require('./config'),
    jwt     = require('jsonwebtoken');

var app = module.exports = express.Router();

// XXX: This should be a database of users :).
var users = [{
  id: 1,
  username: 'sampleuser',
  password: 'sampleuser'
}];

function createToken(user) {
  return jwt.sign(_.omit(user, 'password'), config.secret);
}

function getUserScheme(req) {
  
  var username;
  var type;
  var userSearch = {};

  // The POST contains a username and not an email
  if(req.body.username) {
    username = req.body.username;
    type = 'username';
    userSearch = { username: username };
  }
  // The POST contains an email and not an username
  else if(req.body.email) {
    username = req.body.email;
    type = 'email';
    userSearch = { email: username };
  }

  return {
    username: username,
    type: type,
    userSearch: userSearch
  }
}

app.get('/users', function(req, res) {  
  res.status(201).send(JSON.stringify(users, undefined, 2));
});

app.post('/users', function(req, res) {
  
  var userScheme = getUserScheme(req);  

  if (!userScheme.username || !req.body.password) {
    return res.status(400).send("You must send the username and the password");
  }

  if (_.find(users, userScheme.userSearch)) {
   return res.status(400).send("A user with that username already exists");
  }

  var profile = _.pick(req.body, userScheme.type, 'password', 'roles');
  profile.id = _.max(users, 'id').id + 1;

  users.push(profile);

  res.status(201).send({
    token: createToken(profile)
  });
});

app.post('/sessions/create', function(req, res) {

  var userScheme = getUserScheme(req);

  if (!userScheme.username || !req.body.password) {
    return res.status(400).send("You must send the username and the password");
  }

  var user = _.find(users, userScheme.userSearch);

  if (!user) {
    return res.status(401).send("The username or password don't match");
  }

  if (user.password !== req.body.password) {
    return res.status(401).send("The username or password don't match");
  }

  res.status(201).send({
    token: createToken(user)
  });
});

app.delete('/users', function (req, res) {

  var username = req.body.username;

  var user = _.find(users, {username: username});

  if (!user) {
    return res.status(401).send("User not found");
  }

  _.remove(users, {username: username});

  res.status(201).send({
    token: createToken(user)
  });
});
