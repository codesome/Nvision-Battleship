var app = require('express').Router();
var User = require('../models/User.js');

app.get('/',require('connect-ensure-login').ensureLoggedIn(),function(req,  res, next){
  User.findOne({id:req.user.id},function(err, user){
    if (err) return next(err)
    else if(user){
      if(user.username)
        res.render('index');
      else
        res.render('username');
    }
  });
});

app.post('/updateUsername',require('connect-ensure-login').ensureLoggedIn(),function(req, res, err){
  User.findOne({id:req.user.id},function(err, user){
    if (err) return next(err);
    else if(user){
      if(user.username) res.send('already updated with a username');
      else {
        var username = req.body.username;
        User.findOne({username:username},function(err,u){
          if (err) return next(err)
          else if(u){
            res.send('exists');
          } else {
            user.username = username;
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

app.get('/war', require('connect-ensure-login').ensureLoggedIn(), function(req, res) {
  if (userArray[req.user.id]) return res.send('Mutiple connections are not allowed.')
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
app.get('/auth/facebook', passport.authenticate('facebook'));
app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/login' }), function(req, res) {
  res.redirect('/');
});
// Google
app.get('/auth/google', passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/plus.login', 'https://www.googleapis.com/auth/plus.profile.emails.read'] }));
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), function(req, res) {
  res.redirect('/');
});

// Logout
app.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

module.exports = app;
