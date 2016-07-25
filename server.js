const path = require('path')
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var Entities = require('html-entities').AllHtmlEntities;
var entities = new Entities();

var BattleshipGame = require('./app/game.js');
var GameStatus = require('./app/gameStatus.js');

var port = 8900;

var users = {};
userArray = {};
var gameIdCounter = 1;

passport = require('passport')
const Strategy = require('passport-local').Strategy
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const expressSession = require('express-session')

passport.use(new Strategy(function(username, password, cb){
  if (!username || !password) return cb(new Error('Error'))
  else if (password == 'pass') return cb(null, {username: username, password: 'pass'})
  else return cb(null, false)
}))
passport.serializeUser(function(user, cb){
  cb(null, user.username)
})
passport.deserializeUser(function(id, cb){
  cb(null, {username: id, password:'pass'})
})

var sessionMiddleware = expressSession({secret: '$3cr37 p@$$w0rd', name: 'sessionID', resave: false, saveUninitialized: false})

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());
app.disable('x-powered-by');

app.use('/', require('./routes/index'))

http.listen(port, function(){
  console.log('listening on *:' + port);
});

io.use(function(socket, next) {
  sessionMiddleware(socket.request, socket.request.res, next);
});

io.on('connection', function(socket) {
  console.log((new Date().toISOString()) + ' ID ' + socket.id + ' connected.');
  if (!socket.request.session.passport || userArray[socket.request.session.passport.user]) return;
  // create user object for additional data
  users[socket.id] = {
    inGame: null,
    player: null
  };
  userArray[socket.request.session.passport.user] = socket.id;

  // join waiting room until there are enough players to start a new game
  socket.join('waiting room');

  /**
   * Handle chat messages
   */
  socket.on('chat', function(msg) {
    if(users[socket.id].inGame !== null && msg) {
      console.log((new Date().toISOString()) + ' Chat message from ' + socket.id + ': ' + msg);

      // Send message to opponent
      socket.broadcast.to('game' + users[socket.id].inGame.id).emit('chat', {
        name: 'Opponent',
        message: entities.encode(msg),
      });

      // Send message to self
      io.to(socket.id).emit('chat', {
        name: 'Me',
        message: entities.encode(msg),
      });
    }
  });

  /**
   * Handle shot from client
   */
  socket.on('shot', function(position) {
    var game = users[socket.id].inGame, opponent;

    if(game !== null) {
      // Is it this users turn?
      if(game.currentPlayer === users[socket.id].player) {
        opponent = game.currentPlayer === 0 ? 1 : 0;

        if(game.shoot(position)) {
          // Valid shot
          checkGameOver(game);

          // Update game state on both clients.
          io.to(socket.id).emit('update', game.getGameState(users[socket.id].player, opponent));
          io.to(game.getPlayerId(opponent)).emit('update', game.getGameState(opponent, opponent));
        }
      }
    }
  });

  /**
   * Handle leave game request
   */
  socket.on('leave', function() {
    if(users[socket.id].inGame !== null) {
      leaveGame(socket);

      socket.join('waiting room');
      joinWaitingPlayers();
    }
  });

  /**
   * Handle client disconnect
   */
  socket.on('disconnect', function() {
    console.log((new Date().toISOString()) + ' ID ' + socket.id + ' disconnected.');
    // console.log(socket.request.session.passport.user)
    leaveGame(socket);

    delete users[socket.id];
    delete userArray[socket.request.session.passport.user]
  });

  joinWaitingPlayers();
});

/**
 * Create games for players in waiting room
 */
function joinWaitingPlayers() {
  var players = getClientsInRoom('waiting room');

  if(players.length >= 2) {
    // 2 player waiting. Create new game!
    var game = new BattleshipGame(gameIdCounter++, players[0].id, players[1].id);

    // create new room for this game
    players[0].leave('waiting room');
    players[1].leave('waiting room');
    players[0].join('game' + game.id);
    players[1].join('game' + game.id);

    users[players[0].id].player = 0;
    users[players[1].id].player = 1;
    users[players[0].id].inGame = game;
    users[players[1].id].inGame = game;

    io.to('game' + game.id).emit('join', game.id);

    // send initial ship placements
    io.to(players[0].id).emit('update', game.getGameState(0, 0));
    io.to(players[1].id).emit('update', game.getGameState(1, 1));

    console.log((new Date().toISOString()) + " " + players[0].id + " and " + players[1].id + " have joined game ID " + game.id);
  }
}

/**
 * Leave user's game
 * @param {type} socket
 */
function leaveGame(socket) {
  if(users[socket.id].inGame !== null) {
    console.log((new Date().toISOString()) + ' ID ' + socket.id + ' left game ID ' + users[socket.id].inGame.id);

    // Notifty opponent
    socket.broadcast.to('game' + users[socket.id].inGame.id).emit('notification', {
      message: 'Opponent has left the game'
    });

    if(users[socket.id].inGame.gameStatus !== GameStatus.gameOver) {
      // Game is unfinished, abort it.
      users[socket.id].inGame.abortGame(users[socket.id].player);
      checkGameOver(users[socket.id].inGame);
    }

    socket.leave('game' + users[socket.id].inGame.id);

    users[socket.id].inGame = null;
    users[socket.id].player = null;

    io.to(socket.id).emit('leave');
  }
}

/**
 * Notify players if game over.
 * @param {type} game
 */
function checkGameOver(game) {
  if(game.gameStatus === GameStatus.gameOver) {
    console.log((new Date().toISOString()) + ' Game ID ' + game.id + ' ended.');
    io.to(game.getWinnerId()).emit('gameover', true);
    io.to(game.getLoserId()).emit('gameover', false);
  }
}

/**
 * Find all sockets in a room
 * @param {type} room
 * @returns {Array}
 */
function getClientsInRoom(room) {
  var clients = [];
  for (var id in io.sockets.adapter.rooms[room]) {
    clients.push(io.sockets.adapter.nsp.connected[id]);
  }
  return clients;
}
