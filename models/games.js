var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var gamesSchema = new Schema({

  gameid: String,

  inProgress: Boolean,

  winner: String,

  player1: {

    id: String,

    username: String

  },

  player2: {

    id: String,

    username: String

  },

  player1ships: [{

    x: Number,

    y: Number,

    size: Number,

    horizontal: Boolean

  }],

  player2ships: [{

    x: Number,

    y: Number,

    size: Number,

    horizontal: Boolean

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
