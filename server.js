const path = require('path');
const url = require('url');
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const Entities = require('html-entities').AllHtmlEntities;
const entities = new Entities();

const BattleshipGame = require('./app/game.js');
const GameStatus = require('./app/gameStatus.js');

//db
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/nvisionBattleship');

const port = 8900;

global.users = {};
global.userArray = {};
global.onlineArray = {};
var gameIdCounter = 1;

const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const expressSession = require('express-session');
const MStore = require('connect-mongo')(expressSession);

const User = require('./models/User.js');

const config = require('./config.js');

passport.use(new FacebookStrategy({
    clientID: config.facebook.clientID,
    clientSecret: config.facebook.clientSecret,
    callbackURL: '/auth/facebook/callback',
    profileFields: ['id', 'picture', 'email', 'gender', 'link', 'locale', 'name', 'timezone', 'updated_time', 'verified']
}, function (accessToken, refreshToken, profile, done) {
    console.log(profile);
    process.nextTick(function () {
        if (!profile.emails) profile.emails = [{value: profile.id}];
        User.findOne({
            email: profile.emails[0].value
        }, function (err, user) {
            if (err)
                return done(err);
            if (user) {
                return done(null, user)
            } else {
                var newUser = new User();
                newUser.id = profile.id;
                if (profile.emails && profile.emails[0]) {
                    newUser.email = profile.emails[0].value;
                } else {
                    newUser.email = profile.id;
                }
                newUser.facebook.id = profile.id;
                newUser.facebook.token = accessToken;
                newUser.facebook.displayName = profile.displayName;
                newUser.facebook.profileUrl = profile.profileUrl;
                newUser.facebook.email = profile.emails[0].value;
                newUser.image = profile.photos[0].value;
                newUser.gamesPlayed = 0;
                newUser.gamesWon = 0;
                newUser.save(function (err) {
                    if (err) {
                        return done(err)
                    } else {
                        return done(null, newUser);
                    }
                })
            }
        })
    });
}));

passport.use(new GoogleStrategy({
        clientID: config.google.clientID,
        clientSecret: config.google.clientSecret,
        callbackURL: '/auth/google/callback'
    },
    function (token, refreshToken, profile, done) {
        process.nextTick(function () {
            User.findOne({
                email: profile.emails[0].value
            }, function (err, user) {
                if (err) {
                    return done(err)
                } else if (user) {
                    return done(null, user)
                } else {
                    var newUser = new User();
                    newUser.id = profile.emails[0].value;
                    newUser.email = profile.emails[0].value;
                    newUser.google.id = profile.id;
                    newUser.google.token = token;
                    newUser.google.displayName = profile.displayName;
                    newUser.google.email = profile.emails[0].value;
                    newUser.google.profileUrl = profile._json.url;
                    newUser.image = profile._json.image.url;
                    newUser.gamesPlayed = 0;
                    newUser.gamesWon = 0;
                    newUser.save(function (err) {
                        if (err) {
                            return done(err)
                        } else {
                            return done(null, newUser);
                        }
                    })
                }
            })
        });
    }));

passport.serializeUser(function (user, cb) {
    cb(null, user.id)
});
passport.deserializeUser(function (id, cb) {
    User.findOne({id: id}, function (err, user) {
        if (err) cb(err);
        else cb(null, user);
    });
});

var options = {
    url: 'mongodb://localhost/nvisionBattleshipSession',
    autoRemove: 'native'
};
const sessionMiddleware = expressSession({
    secret: '$3cr37 p@$$w0rd',
    store: new MStore(options),
    name: 'sessionID',
    resave: true,
    saveUninitialized: true
})

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(require('morgan')('dev'));
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

app.use('/', function (req, res, next) {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    next();
});
global.passport = passport;
app.use('/', require('./routes/index'));

// 404 Handler
app.use(function (req, res, next) {
    res.status(404).send('Sorry cant find that!');
});

// Other errors
app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

http.listen(port, function () {
    console.log('listening on *:' + port);
});

io.use(function (socket, next) {
    sessionMiddleware(socket.request, socket.request.res, next);
});

io.on('connection', function (socket) {
    var against = url.parse(socket.handshake.headers.referer).pathname;
    // console.log((new Date().toISOString()) + ' ID ' + socket.id + ' connected.');
    // if (!socket.request.session.passport || userArray[socket.request.session.passport.user]) return;
    // create user object for additional data
    if (onlineArray[socket.request.session.passport.user]) onlineArray[socket.request.session.passport.user].push(socket.id);
    else onlineArray[socket.request.session.passport.user] = [socket.id];
    // console.log(onlineArray);
    io.emit("online-users", onlineArray);
    //console.log(onlineArray);


    if (against == '/war!' || against.substring(0, 3) == '/u/') {
        users[socket.id] = {
            inGame: null,
            player: null,
            email: socket.request.session.passport.user
        };
        userArray[socket.request.session.passport.user] = socket.id;
        // join waiting room until there are enough players to start a new game
        if (against == "/war!") socket.join('waiting room');
        else if (against.substring(0, 3) == '/u/') {
            socket.join('waiting for someone');
            //console.log(onlineArray);
            //console.log(against);
            // console.log(onlineArray[against.substring(3)]);
            for (var i in onlineArray[against.substring(3)]) {
                // console.log(i, onlineArray[against.substring(3)][i]);
                io.to(onlineArray[against.substring(3)][i]).emit('notification', {
                    username: socket.request.session.passport.user
                })
            }

        }

        /**
         * Handle chat messages
         */
        socket.on('chat', function (msg) {
            if (users[socket.id].inGame !== null && msg) {
                //console.log((new Date().toISOString()) + ' Chat message from ' + socket.id + ': ' + msg);

                // Send message to opponent
                socket.broadcast.to('game' + users[socket.id].inGame.id).emit('chat', {
                    name: 'Opponent',
                    message: entities.encode(msg)
                });

                // Send message to self
                io.to(socket.id).emit('chat', {
                    name: 'Me',
                    message: entities.encode(msg)
                });
            }
        });

        /**
         * Handle shot from client
         */
        socket.on('shot', function (position) {
            var game = users[socket.id].inGame, opponent;

            if (game !== null) {
                // Is it this users turn?
                if (game.currentPlayer === users[socket.id].player) {
                    opponent = game.currentPlayer === 0 ? 1 : 0;

                    if (game.shoot(position)) {
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
        socket.on('leave', function () {
            if (users[socket.id].inGame !== null) {
                leaveGame(socket, false);
                socket.join('waiting room');
                joinWaitingPlayers();
            }
        });

        /**
         * Handle client disconnect
         */
        socket.on('disconnect', function () {
            //console.log((new Date().toISOString()) + ' ID ' + socket.id + ' disconnected.');
            // console.log(socket.request.session.passport.user)
            leaveGame(socket, true);
            delete users[socket.id];
            delete userArray[socket.request.session.passport.user];
            var ind = onlineArray[socket.request.session.passport.user].indexOf(socket.id);
            if (ind >= 0) onlineArray[socket.request.session.passport.user].splice(ind, 1);
            // console.log(onlineArray);
            io.emit("online-users", onlineArray)
        });
        joinWaitingPlayers();
        joinWaitingPlayersForSomeone();
    } else {

        /**
         * Handle client disconnect
         */
        socket.on('disconnect', function () {
            var ind = onlineArray[socket.request.session.passport.user].indexOf(socket.id);
            if (ind >= 0) onlineArray[socket.request.session.passport.user].splice(ind, 1);
            // console.log(onlineArray);
            io.emit("online-users", onlineArray)
        });
    }

});

/**
 * Create games for players in waiting room
 */
function joinWaitingPlayersForSomeone() {
    var players = getClientsInRoom('waiting for someone');
    if (players.length == 0) return;
    var player = players[players.length - 1];
    var against = url.parse(player.handshake.headers.referer).pathname.substring(3);
    if (userArray[against]) {
        var otherPlayer = io.sockets.connected[userArray[against]];
        if (!otherPlayer) return;
        if (otherPlayer.rooms.indexOf('waiting room') >= 0) {
            // 2 player waiting. Create new game!
            var game = new BattleshipGame(gameIdCounter++, player.id, otherPlayer.id);
            // create new room for this game
            player.leave('waiting for someone');
            otherPlayer.leave('waiting room');
            player.join('game' + game.id);
            otherPlayer.join('game' + game.id);

            users[player.id].player = 0;
            users[otherPlayer.id].player = 1;
            users[player.id].inGame = game;
            users[otherPlayer.id].inGame = game;

            io.to('game' + game.id).emit('join', {id: game.id, gameid: game.gameid});

            // send initial ship placements
            io.to(player.id).emit('update', game.getGameState(0, 0));
            io.to(otherPlayer.id).emit('update', game.getGameState(1, 1));
            io.to(player.id).emit('opponent', users[otherPlayer.id].email);
            io.to(otherPlayer.id).emit('opponent', users[player.id].email);
        } else if (otherPlayer.rooms.indexOf('waiting for someone') >= 0 && userArray[url.parse(otherPlayer.handshake.headers.referer).pathname.substring(3)] == player.id) {
            // 2 player waiting. Create new game!
            var game = new BattleshipGame(gameIdCounter++, player.id, otherPlayer.id);
            // create new room for this game
            player.leave('waiting for someone');
            otherPlayer.leave('waiting for someone');
            player.join('game' + game.id);
            otherPlayer.join('game' + game.id);

            users[player.id].player = 0;
            users[otherPlayer.id].player = 1;
            users[player.id].inGame = game;
            users[otherPlayer.id].inGame = game;

            io.to('game' + game.id).emit('join', {id: game.id, gameid: game.gameid});

            // send initial ship placements
            io.to(player.id).emit('update', game.getGameState(0, 0));
            io.to(otherPlayer.id).emit('update', game.getGameState(1, 1));
            io.to(player.id).emit('opponent', users[otherPlayer.id].email);
            io.to(otherPlayer.id).emit('opponent', users[player.id].email);
        }
        // players = getClientsInRoom('waiting for someone');
    }
}

function joinWaitingPlayers() {
    var players = getClientsInRoom('waiting room');

    if (players.length >= 2) {
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

        io.to('game' + game.id).emit('join', {id: game.id, gameid: game.gameid, opponent: users[players[1].id].email});

        // send initial ship placements
        io.to(players[0].id).emit('update', game.getGameState(0, 0));
        io.to(players[1].id).emit('update', game.getGameState(1, 1));
        io.to(players[0].id).emit('opponent', users[players[1].id].email);
        io.to(players[1].id).emit('opponent', users[players[0].id].email);
        //console.log((new Date().toISOString()) + " " + players[0].id + " and " + players[1].id + " have joined game ID " + game.id);
    }
}

/**
 * Leave user's game
 * @param {type} socket
 */
function leaveGame(socket, disconnected) {
    var game = users[socket.id].inGame;
    if (game !== null) {
        //console.log((new Date().toISOString()) + ' ID ' + socket.id + ' left game ID ' + game.id);

        // Notifty opponent
        socket.broadcast.to('game' + game.id).emit('notification', {
            message: 'Opponent has left the game'
        });

        if (game.gameStatus !== GameStatus.gameOver) {
            // Game is unfinished, abort it.
            game.abortGame(users[socket.id].player);
            if (disconnected) {
                game.endGame({
                    winnerId: users[game.getWinnerId()].email,
                    loserId: users[game.getLoserId()].email
                });
            }
            checkGameOver(game);
        }

        socket.leave('game' + game.id);

        game = null;
        users[socket.id].player = null;

        io.to(socket.id).emit('leave');
    }
}

/**
 * Notify players if game over.
 * @param {type} game
 */
function checkGameOver(game) {
    if (game.gameStatus === GameStatus.gameOver) {
        //console.log((new Date().toISOString()) + ' Game ID ' + game.id + ' ended.');
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
        if (io.sockets.adapter.rooms[room].hasOwnProperty(id)) clients.push(io.sockets.adapter.nsp.connected[id]);
    }
    return clients;
}
