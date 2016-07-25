var app = require('express').Router();

app.get('/', require('connect-ensure-login').ensureLoggedIn(), function(req, res) {
  if (userArray[req.user.username]) return res.send('Mutiple connections are not allowed.')
  res.render('index')
});
app.get('/login', function(req, res) {
  if (req.user) res.redirect('/');
  else res.render('login');
});
app.post('/login', passport.authenticate('local', {
  successReturnToOrRedirect: '/',
  failureRedirect: '/login'
}), function(req, res) {
  res.redirect('/');
});

// Facebbok
app.get('/auth/facebook', passport.authenticate('facebook'));
app.get('/auth/facebook/callback', passport.authenticate('facebook', { successRedirect: '/', failureRedirect: '/login' }));

// Google
app.get('/auth/google', passport.authenticate('google', { scope: 'https://www.google.com/m8/feeds' });
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), function(req, res) {
  res.redirect('/');
});

// Logout
app.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

module.exports = app;
