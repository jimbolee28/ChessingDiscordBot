const Discord = require('discord.js')
const ChessGame = require('../models/chessgame.js');
const Player = require('../models/player.js');
const { Chess } = require('chess.js');
const MongoClient = require('mongodb').MongoClient;
const config = require('../config.json');
const prefix = config.prefix;
const url = config.mongoURL;

module.exports = {

    name: 'move',
    description: 'makes a chess move',

    execute(message, args) {

        var embed = new Discord.MessageEmbed();

        Player.findOne({
            userId: message.author.id
        }, (errPlayer, user) => {

            // error handling
            if (errPlayer) {
                console.log(errPlayer);
            }

            // if user is not registered
            else if (!user) {
                embed.setColor(0xff0000).setDescription('You are not registered. Type ' + prefix + 'register to register.');
                message.channel.send(embed);
                return;
            }

            // if user is already registered
            else {

                for (var i = 0; i < user.games.length; i++) {

                    // if user is in game, the user is able to move
                    if (user.games[i].guildId === message.guild.id) {

                        ChessGame.findOne({
                            idGame: user.games[i].idGame
                        }, (errGame, currGame) => {

                            // error handling
                            if (errGame) {
                                console.log(errGame);
                            }

                            const chess = new Chess(currGame.fen);

                            // if it is not the player's turn
                            if (user.games[i].color !== chess.turn()) {
                                embed.setColor(0xff0000).setDescription('It is not your turn yet!');
                                message.channel.send(embed);
                                return;
                            }

                            // if 0 or >1 move is entered
                            if (args.length !== 1) {
                                embed.setColor(0xff0000).setDescription('Please enter a single chess move in Long or Standard Algebraic Notation. Ex: e2-e4, e4');
                                message.channel.send(embed);
                                return;
                            }

                            // if the move is illegal or entered incorrectly (MAKES MOVE)
                            if (chess.move(args[0], { sloppy: true }) === null) {
                                embed.setColor(0xff0000).setDescription('Invalid move. Check if the move is legal or if you entered the move with the correct notation.');
                                message.channel.send(embed);
                                return;
                            }

                            // if the game is not over
                            if (!chess.game_over()) {
                                currGame.fen = chess.fen();
                                currGame.save().then(result => console.log(result)).catch(err => console.log(err));
                                embed.setColor(0x33ff36)
                                    .setImage("http://www.fen-to-image.com/image/24/single/coords/" + chess.fen().split(' ')[0])
                                    .setDescription('<@' + (chess.turn() === 'w' ? currGame.idWhite : currGame.idBlack) + '>, it is your turn!');
                                message.channel.send(embed);
                                return;
                                embed.setColor()
                            }

                            // if game is over, send appropriate message
                            embed.setTitle("Game Over").setImage("http://www.fen-to-image.com/image/24/single/coords/" + chess.fen().split(' ')[0]);
                            if (chess.in_draw() || chess.in_stalemate() || chess.in_threefold_repetition()) {
                                embed.setColor(0xffff00).setDescription('Draw!');
                                message.channel.send(embed);
                            }
                            else if (chess.turn() === 'b') {
                                embed.setColor(0x33ff36).setDescription('<@' + currGame.idWhite + '> (white) won!');
                                message.channel.send(embed);
                            }
                            else {
                                embed.setColor(0x33ff36).setDescription('<@' + currGame.idBlack + '> (white) won!');
                                message.channel.send(embed);
                            }

                            // deleting game from player array
                            Player.find({
                                "games.idGame": currGame.idGame
                            }, (errDocs, docs) => {
                                if (errDocs) {
                                    console.log(errDocs);
                                }
                                for (var i = 0; i <= 1; i++) {
                                    for (var j = 0; j < docs[i].games.length; j++) {
                                        if (docs[i].games[j].idGame === currGame.idGame) {
                                            docs[i].games.splice(j, 1);
                                            docs[i].save().then(result => console.log(result)).catch(err => console.log(err));
                                        }
                                    }
                                }
                                    
                            });

                            // delete game from DB
                            MongoClient.connect(url, {
                                useNewUrlParser: true,
                                useUnifiedTopology: true
                            }, function (err, database) {
                                if (err) throw err;
                                var myQuery = { idGame: currGame.idGame };
                                database.db("ChessGames").collection("games").deleteMany(myQuery, function (err, obj) {
                                    if (err) throw err;
                                    console.log(obj.result.n + " document(s) deleted");
                                    database.close();
                                });
                            });

                        });

                        return;
                    }
                }

                // game not found in current server
                embed.setColor(0xff0000).setDescription('You are not in a game right now.');
                message.channel.send(embed);

            }

        });

    }

}