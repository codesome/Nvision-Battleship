var app = require('express').Router();
var User = require('../models/User.js');
var games = require('../models/games.js');

app.get('/',require('connect-ensure-login').ensureLoggedIn(),function(req,  res, next){
  User.findOne({id:req.user.id},function(err, user){
    if (err) return next(err);
    else if(user){
      if(user.username)
        res.render('index', {username: user.username});
      else
        res.render('username',{err:null});
    }
  });
});

app.get('/online',require('connect-ensure-login').ensureLoggedIn(),function(req,  res, next){
  User.findOne({id:req.user.id},function(err, user){
    if (err) return next(err);
    else if(user){
      if(user.username)
        res.render('online', {username: user.username});
      else
        res.render('username');
    }
  });
});

app.post('/updateUsername',require('connect-ensure-login').ensureLoggedIn(),function(req, res){
  User.findOne({id:req.user.id},function(err, user){
    if (err) return next(err);
    else if(user){
      if(user.username) res.send('already updated with a username');
      else {
        var username = req.body.username;
        var re = /^[a-z][a-z0-9_.]*$/;
        if (!re.test(username)) return res.render('username', {err: 'The username can contain only lowercase letters[a-z], numbers[0-9], underscore and periods. It should start with a lowercase letter'});
        User.findOne({username:username},function(err,u){
          if (err) return next(err);
          else if(u){
            res.render('username', {err: 'username is already taken'});
          } else {
            user.username = username;
            user.id = username;
            req.session.passport.user = username;
            user.save(function(err){
              if(err) return next(err);
              else res.redirect('/');
            });
          }
        });
      }
    }
  });
});

app.get('/war!', require('connect-ensure-login').ensureLoggedIn(), function(req, res) {
  User.findOne({id:req.user.id},function(err, user){
    if (err) return next(err);
    else if(user){
      if(user.username) {
        if (userArray[req.user.id]) return res.send('Mutiple connections are not allowed.');
        res.render('game');
      }
      else {
        res.redirect('/');
      }
    }
  });
  // if (userArray[req.user.id]) return res.send('Mutiple connections are not allowed.')
  // res.render('game')
});

app.get('/u/*', require('connect-ensure-login').ensureLoggedIn(), function(req, res) {
  if (userArray[req.user.id]) return res.send('Mutiple connections are not allowed.');
  res.render('game')
});

app.get('/myHistory',require('connect-ensure-login').ensureLoggedIn(),function(req,res){
  if(req.user && req.user._id){
    User.findOne({_id:req.user._id},function(err,user){
      if(user){
        res.render('history',{data:user.logs});
      } else {
        res.redirect('/');
      }
    });
  } else {
    res.redirect('/');
  }
});

app.get('/login', function(req, res) {
  if (req.user) res.redirect('/');
  else res.render('login');
});

// Facebbok
/*app.get('/auth/facebook', passport.authenticate('facebook', {scope: ['email', 'public_profile']}));
app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/' }), function(req, res) {
  res.redirect('/');
});*/

// Google
app.get('/auth/google', passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/plus.login', 'https://www.googleapis.com/auth/plus.profile.emails.read'] }));
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/' }), function(req, res) {
  res.redirect('/');
});

app.get('/user', require('connect-ensure-login').ensureLoggedIn(), function(req, res){
  res.send(req.user)
});

// Logout
app.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

app.get('/replay/:gameid',function(req,res){
  games.findOne({gameid:req.params.gameid},function(err,game){
    if(game){
      if(game.inProgress)
        res.send('Game is in progress!');
      else
        res.render('replay',{game:game});
    } else {
      res.send('Invalid URL');
    }
  });
});

module.exports = app;
