const Discord = require('discord.js')
const ChessGame = require('../models/chessgame.js');
const Player = require('../models/player.js');
const MongoClient = require('mongodb').MongoClient;
const config = require('../config.json');
const url = config.mongoURL;

module.exports = {

    name: 'resign',
    description: 'resigns the chess game',

    execute(message, args) {

        var embed = new Discord.MessageEmbed().setColor(0xff0000);

        Player.findOne({
            userId: message.author.id
        }, (errPlayer, user) => {

            // error handling
            if (errPlayer) {
                console.log(errPlayer);
            }

            // if user is not registered
            else if (!user) {
                embed.setColor(0xff0000).setDescription('You are not registered nor in game.');
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

                            embed.setColor(0xff0000).setTitle("Game Over")
                                .setImage("http://www.fen-to-image.com/image/24/single/coords/" + currGame.fen.split(' ')[0])
                                .setDescription('<@' + user.userId + '> ' + (user.games[i].color === 'w' ? '(white)' : '(black)') + ' has resigned! Game over!');
                            message.channel.send(embed);

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
                                            console.log('Deleted Game');
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