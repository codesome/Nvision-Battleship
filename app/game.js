var Player = require('./player.js');
var Settings = require('./settings.js');
var GameStatus = require('./gameStatus.js');
var User = require('../models/User.js');

/**
 * BattleshipGame constructor
 * @param {type} id Game ID
 * @param {type} idPlayer1 Socket ID of player 1
 * @param {type} idPlayer2 Socket ID of player 2
 */
function BattleshipGame(id, idPlayer1, idPlayer2) {
  var This = this;
  var d = new Date();
  User.findOne({id:users[idPlayer1]},function(err,user1){
    User.findOne({id:users[idPlayer2]},function(err,user2){
      if(user1 && user2){
        user1.logs.push({
          playedWith: user2.username,
          startTime: d,
          result: false
        });
        user1.gamesPlayed++;
        user2.logs.push({
          playedWith: user1.username,
          startTime: d,
          result: false
        });
        user2.gamesPlayed++;
        user1.save(function(err){
          if(err) console.log(err);
          user2.save(function(err){
            if(err) console.log(err);
            This.id = id;
            This.currentPlayer = Math.floor(Math.random() * 2);
            This.winningPlayer = null;
            This.gameStatus = GameStatus.inProgress;
            This.players = [new Player(idPlayer1), new Player(idPlayer2)];
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
  this.winningPlayer = player === 0 ? 1 : 0;
  this.endGame();
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
    if(!this.players[opponent].shoot(gridIndex)) {
      // Miss
      this.switchPlayer();
    }

    // Check if game over
    if(this.players[opponent].getShipsLeft() <= 0) {
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
BattleshipGame.prototype.endGame = function() {
  var This = this;
  var d = new Date();
  User.findOne({id:This.getWinnerId()},function(err,winner){
    User.findOne({id:This.getLoserId()},function(err,loser){
      if(winner && loser) {
        var loserName = loser.username;
        var winnerName = winner.username;
        for(var i=0 ; i<winner.logs.length ; i++){
          if(winner.logs[i].playedWith == loserName){
            winner.logs[i].result = true;
            winner.logs[i].endTime = d;
            break;
          }
        }
        for(var i=0 ; i<loser.logs.length ; i++){
          if(loser.logs[i].playedWith == winnerName){
            loser.logs[i].result = true;
            loser.logs[i].endTime = d;
            break;
          }
        }
        winner.gamesWon++;
        winner.save(function(err){
          if(err) console.log(err);
          loser.save(function(err){
            if(err) console.log(err);
            This.gameStatus = GameStatus.gameOver;
            return;
          });
        });
      }
    });
  });
};

module.exports = BattleshipGame;
