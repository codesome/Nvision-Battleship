var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var scoreSchema = new Schema({

    users: [
        {
            username: String,
            gamesWon: Number
        }
    ],

    updateDate: Date,

});

module.exports = mongoose.model( 'Score' , scoreSchema );
