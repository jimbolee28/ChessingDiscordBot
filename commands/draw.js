const Discord = require('discord.js')
const ChessGame = require('../models/chessgame.js');
const Player = require('../models/player.js');
const MongoClient = require('mongodb').MongoClient;
const config = require('../config.json');
const url = config.mongoURL;

module.exports = {

    name: 'draw',
    description: 'offers a draw',

    async execute(message, args) {

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
                        }, async (errGame, currGame) => {

                            // error handling
                            if (errGame) {
                                console.log(errGame);
                            }

                            var opponentId = "";
                            if (user.games[i].color === 'w') opponentId = currGame.idBlack;
                            else opponentId = currGame.idWhite;

                            // offer draw message
                            embed.setColor("0xffff00").setDescription('<@' + user.userId + '> has offered a draw. <@' + opponentId + '>, you have 2 minutes to accept. Do you accept?');
                            message.channel.send(embed).then(async msg => {

                                await msg.react('✅');
                                await msg.react('❎');

                                const filter = (reaction, user) => {
                                    return (reaction.emoji.name === '✅' || reaction.emoji.name === '❎') && user.id === opponentId;
                                };

                                msg.awaitReactions(filter, {
                                    max: 1, // only 1 react allowed
                                    time: 120000  // 120000 ms = 120 s = 2 min
                                }).then(collected => {

                                    // draw accepted
                                    if (collected.first().emoji.name == '✅') {

                                        embed.setColor(0x33ff36).setTitle("Game Over")
                                            .setImage("http://www.fen-to-image.com/image/24/single/coords/" + currGame.fen.split(' ')[0])
                                            .setDescription('Draw agreed between <@' + currGame.idWhite + '> and <@' + currGame.idBlack + '>!');
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

                                    }

                                    // draw rejected
                                    else {
                                        embed.setColor(0xff0000).setDescription('<@' + opponentId + '> has rejected the draw. The game continues.');
                                        message.channel.send(embed);
                                    }

                                }).catch(() => {
                                    // draw rejected from 2 min timeout
                                    embed.setColor(0xff0000).setDescription('<@' + opponentId + '> has not responded to the draw offer. The game continues.');
                                    message.channel.send(embed);
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