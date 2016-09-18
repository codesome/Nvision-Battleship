var app = require('express').Router();
var User = require('../models/User.js');
var games = require('../models/games.js');

function ensureNotAMobile(req,res,next) {
  var ua = req.headers['user-agent'].toLowerCase();
  if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(ua)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(ua.substr(0,4))) {
    res.send("<html><head><title>&eta;vision - Battleship</title><meta name='viewport' content='width=device-width, initial-scale=1'></head><body>This game is best played on a bigger screen</body></html>");
  } else {
    next();
  }
}

app.get('/',ensureNotAMobile,require('connect-ensure-login').ensureLoggedIn(),function(req,  res, next){
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

app.get('/online',ensureNotAMobile,require('connect-ensure-login').ensureLoggedIn(),function(req,  res, next){
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

app.post('/updateUsername',ensureNotAMobile,require('connect-ensure-login').ensureLoggedIn(),function(req, res){
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

app.get('/war!',ensureNotAMobile,require('connect-ensure-login').ensureLoggedIn(), function(req, res) {
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

app.get('/u/*',ensureNotAMobile, require('connect-ensure-login').ensureLoggedIn(), function(req, res) {
  if (userArray[req.user.id]) return res.send('Mutiple connections are not allowed.');
  res.render('game')
});

app.get('/myHistory',ensureNotAMobile,require('connect-ensure-login').ensureLoggedIn(),function(req,res){
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

/*app.post('/leaderboard',ensureNotAMobile,require('connect-ensure-login').ensureLoggedIn(),function(req,res){
  if(req.user && req.user._id){
    User.find({},function(err,users){
      if(users){
        var u = [];
        var gamesWon;
        var temp;
        for(var i=0 ; i<users.length ; i++) {
          gamesWon = 0;
          temp = {};
          for(var j=0 ; j<users[i].logs.length ; j++) {
            if(!temp[users[i].logs[j].playedWith] && users[i].logs[j].result) {
              temp[users[i].logs[j].playedWith] = true;
              gamesWon++;
            }
          }
          u.push({
            gamesWon:gamesWon,
            lastWinDate: users[i].lastWinDate,
            username: users[i].username,
          });
        }
        u.sort(function compare(a,b) {
          if (a.gamesWon > b.gamesWon)
            return -1;
          else if (a.gamesWon < b.gamesWon)
            return 1;
          else {
            if(Date.parse(a.lastWinDate) < Date.parse(b.lastWinDate))
              return -1;
            else
              return 1;
          }
        });
        res.render('leaderboard',{users:u});
      } else {
        res.redirect('/');
      }
    });
  } else {
    res.redirect('/');
  }
});*/

var Score = require('../models/Score.js');

app.get('/leaderboard',function (req,res) {
  Score.findOne({}, function (err, scores) {
    if(scores){
      var d = new Date(Date.parse(scores.updateDate));

      console.log(d);
      var x = '';
      if(d){
        x = d.getDate() + '/' + (d.getMonth()+1) + '/' + d.getFullYear() + '&nbsp; ' + ('0'+d.getHours()).slice(-2) + ':' + ('0'+d.getMinutes()).slice(-2) + ':' + ('0'+d.getSeconds()).slice(-2) + ' hrs';
      }

      res.render('leaderboard',{users:scores.users, update: x});
    }
    else
      res.redirect('/');
  });
});

app.get('/login', ensureNotAMobile,function(req, res) {
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

// app.get('/user', require('connect-ensure-login').ensureLoggedIn(), function(req, res){
//   res.send(req.user)
// });

app.get('/rules',ensureNotAMobile, require('connect-ensure-login').ensureLoggedIn(), function(req, res){
  res.render('rules');
});

// Logout
app.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

app.get('/replay/:gameid',ensureNotAMobile,function(req,res){
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

/*app.get('/wantitgetit/games',function(req,res){
  games.find({},function(err,games){
    res.render('gamesStats',{games:games});
  });
});*/

/*app.get('/wantitgetit/users',function(req,res){
  User.find({},function(err,users){
    res.render('userStats',{users:users});
  });
});*/

module.exports = app;
