var Player = require('./player.js');
var Settings = require('./settings.js');
var GameStatus = require('./gameStatus.js');
var User = require('../models/User.js');
var games = require('../models/games.js');

/**
 * BattleshipGame constructor
 * @param {type} id Game ID
 * @param {type} idPlayer1 Socket ID of player 1
 * @param {type} idPlayer2 Socket ID of player 2
 */
function BattleshipGame(id, idPlayer1, idPlayer2) {
  var gameid = ''+idPlayer1+idPlayer2;
  this.id = id;
  this.gameid = gameid;
  this.currentPlayer = Math.floor(Math.random() * 2);
  this.winningPlayer = null;
  this.gameStatus = GameStatus.inProgress;
  this.players = [new Player(idPlayer1), new Player(idPlayer2)];
  var d = new Date();

  var player1ships = [] , player2ships = [];
  var allShips = this.players[0].ships;
  for(var i=0 ; i <allShips.length ; i++){
    player1ships.push({
      x: allShips[i].x,
      y: allShips[i].y,
      size: allShips[i].size,
      horizontal: allShips[i].horizontal
    });
  }
  allShips = this.players[1].ships;
  for(var i=0 ; i <allShips.length ; i++){
    player2ships.push({
      x: allShips[i].x,
      y: allShips[i].y,
      size: allShips[i].size,
      horizontal: allShips[i].horizontal
    });
  }
  User.findOne({id:users[idPlayer1].email},function(err,user1){
    User.findOne({id:users[idPlayer2].email},function(err,user2){

      if(user1 && user2){
        games({
          gameid: gameid,
          inProgress: true,
          winner: "none",
          player1: {
            id: user1.id,
            username: user1.username
          },
          player2: {
            id: user2.id,
            username: user2.username
          },
          player1ships: player1ships,
          player2ships: player2ships
        }).save(function(err){
          if(err) console.log(err);
        });
        user1.logs.push({
          gameid: gameid,
          playedWith: user2.username,
          startTime: d,
          result: false
        });
        user1.gamesPlayed++;
        user2.logs.push({
          gameid: gameid,
          playedWith: user1.username,
          startTime: d,
          result: false
        });
        user2.gamesPlayed++;
        user1.save(function(err){
          if(err) console.log(err); // TODO Handle error
          user2.save(function(err){
            if(err) console.log(err); // TODO Handle error
          });
        });
      }
    });
  });
}

/**
 * Get socket ID of player
 * @param {type} player
 * @returns {undefined}
 */
BattleshipGame.prototype.getPlayerId = function(player) {
  return this.players[player].id;
};

/**
 * Get socket ID of winning player
 * @returns {BattleshipGame.prototype@arr;players@pro;id}
 */
BattleshipGame.prototype.getWinnerId = function() {
  if(this.winningPlayer === null) {
    return null;
  }
  return this.players[this.winningPlayer].id;
};

/**
 * Get socket ID of losing player
 * @returns {BattleshipGame.prototype@arr;players@pro;id}
 */
BattleshipGame.prototype.getLoserId = function() {
  if(this.winningPlayer === null) {
    return null;
  }
  var loser = this.winningPlayer === 0 ? 1 : 0;
  return this.players[loser].id;
};

/**
 * Switch turns
 */
BattleshipGame.prototype.switchPlayer = function() {
  this.currentPlayer = this.currentPlayer === 0 ? 1 : 0;
};

/**
 * Abort game
 * @param {Number} player Player who made the request
 */
BattleshipGame.prototype.abortGame = function(player) {
  // give win to opponent
  this.gameStatus = GameStatus.gameOver;
  this.winningPlayer = player === 0 ? 1 : 0;
}

/**
 * Fire shot for current player
 * @param {Object} position with x and y
 * @returns {boolean} True if shot was valid
 */
BattleshipGame.prototype.shoot = function(position) {
  var opponent = this.currentPlayer === 0 ? 1 : 0,
      gridIndex = position.y * Settings.gridCols + position.x;

  if(this.players[opponent].shots[gridIndex] === 0 && this.gameStatus === GameStatus.inProgress) {
    // Square has not been shot at yet.
    var gameshot = {
      player: (opponent+1)%2,
      x: position.x,
      y: position.y
    };
    this.switchPlayer();
    if(!this.players[opponent].shoot(gridIndex)) {
      gameshot['type'] = 'miss';
    } else {
      gameshot['type'] = 'hit';
    }
    games.findOne({gameid:this.gameid},function(err,game){
      if(game){
        game.shots.push(gameshot);
        game.save(function(err){
          if(err) console.log(err);
        });
      }
    });

    // Check if game over
    if(this.players[opponent].getShipsLeft() <= 0) {
      this.gameStatus = GameStatus.gameOver;
      this.winningPlayer = opponent === 0 ? 1 : 0;
      this.endGame();
    }

    return true;
  }

  return false;
};

/**
 * Get game state update (for one grid).
 * @param {Number} player Player who is getting this update
 * @param {Number} gridOwner Player whose grid state to update
 * @returns {BattleshipGame.prototype.getGameState.battleshipGameAnonym$0}
 */
BattleshipGame.prototype.getGameState = function(player, gridOwner) {
  return {
    turn: this.currentPlayer === player,                 // is it this player's turn?
    gridIndex: player === gridOwner ? 0 : 1,             // which client grid to update (0 = own, 1 = opponent)
    grid: this.getGrid(gridOwner, player !== gridOwner)  // hide unsunk ships if this is not own grid
  };
};

/**
 * Get grid with ships for a player.
 * @param {type} player Which player's grid to get
 * @param {type} hideShips Hide unsunk ships
 * @returns {BattleshipGame.prototype.getGridState.battleshipGameAnonym$0}
 */
BattleshipGame.prototype.getGrid = function(player, hideShips) {
  return {
    shots: this.players[player].shots,
    ships: hideShips ? this.players[player].getSunkShips() : this.players[player].ships
  };
};

/**
 * Ends the game
 */
BattleshipGame.prototype.endGame = function(params) {
  var This = this;
  var d = new Date();
  This.gameStatus = GameStatus.gameOver;
  var winnerId,loserId;
  if(params){
    winnerId = params.winnerId;
    loserId = params.loserId;
  } else {
    winnerId = users[This.getWinnerId()].email;
    loserId = users[This.getLoserId()].email;
  }
  User.findOne({id:winnerId},function(err,winner){
    User.findOne({id:loserId},function(err,loser){
      if(winner && loser) {
        var winnerGamePos = winner.logs.length-1;
        winner.logs[winnerGamePos].result = true;
        winner.logs[winnerGamePos].endTime = d;
        var loserGamePos = loser.logs.length-1;
        loser.logs[loserGamePos].endTime = d;
        winner.gamesWon++;
        winner.save(function(err){
          if(err) console.log(err); // TODO Handle error
          loser.save(function(err){
            if(err) console.log(err); // TODO Handle error
            games.findOne({gameid:This.gameid},function(err,game){
              if(err) console.log(err); // TODO Handle error
              if(game) {
                game.inProgress = false;
                game.winner = winner.username;
                game.save(function(err){
                  if(err) console.log(err); // TODO Handle error
                });
              }
            });
          });
        });
      }
    });
  });
};

module.exports = BattleshipGame;
