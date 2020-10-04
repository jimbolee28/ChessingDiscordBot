const mongoose = require('mongoose');

const userGameSchema = mongoose.Schema({
    guildId: String,
    idGame: String,
    color: String
});

const playerSchema = mongoose.Schema({
    userId: String,
    games: [userGameSchema]
});

module.exports = mongoose.model("Players", playerSchema);