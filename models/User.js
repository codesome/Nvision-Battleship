var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var userSchema = new Schema({

  id: String,

  username: String,

  password: String,

  email: String,

  phone: String,

  gamesPlayed: Number,

  gamesWon: Number,

  logs: [{

    playedWith: String, // id

    status: String // 'W'==won 'L'==lost 'N'==no_result

  }]

});

userSchema.index({ _id: 1, id: 1, username: 1 }, { unique: true });

var User = mongoose.model( 'User' , userSchema );

module.exports = User;
