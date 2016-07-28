var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var gamesSchema = new Schema({

  gameid: String,

  player1: {

    id: String,

    username: String

  },

  player2: {

    id: String,

    username: String

  },

  ships: [{

    player: Number,

    from: String,

    to: String

  }],

  shots: [{

      player: Number,

      type: {type:String},

      x: Number,

      y: Number

  }]

});

gamesSchema.index({ gameid: 1 }, { unique: true });

var games = mongoose.model( 'games' , gamesSchema );

module.exports = games;
