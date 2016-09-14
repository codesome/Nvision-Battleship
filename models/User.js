var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var userSchema = new Schema({

  id: String,

  username: String,

  email: String,

  gamesPlayed: Number,

  gamesWon: Number,

  lastWinDate: Date,

  image: String,

  logs: [{

    gameid: String,

    playedWith: String,

    startTime: Date,

    endTime: Date,

    result: Boolean,

    disconnection: Boolean,

  }],

  google: {

    id: String,

    token: String,

    displayName: String,

    email: String,

    profileUrl: String

  }

});

userSchema.index({id: 1, username: 1, email:1 }, { unique: true });

var User = mongoose.model( 'User' , userSchema );

module.exports = User;
