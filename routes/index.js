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
app.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

module.exports = app;
