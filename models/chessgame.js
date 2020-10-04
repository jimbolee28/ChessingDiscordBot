const mongoose = require('mongoose');

const gameSchema = mongoose.Schema({
    idGame: String,
    fen: String,
    idWhite: String,
    idBlack: String
});

module.exports = mongoose.model("Games", gameSchema);