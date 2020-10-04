const Discord = require('discord.js');
const ChessGame = require('../models/chessgame.js');
const Player = require('../models/player.js');
const config = require('../config.json');
const prefix = config.prefix;

function guidGenerator() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

module.exports = {

    name: 'startgame',
    description: 'starts new chess game',

    execute(message, beginFen, playerWhiteId, playerBlackId) {

        var embed = new Discord.MessageEmbed();
        
        Player.find({
            userId: { $in: [playerWhiteId, playerBlackId] }
        }, (errPlayer, docs) => {

            // error handling
            if (errPlayer) {
                console.log(errPlayer);
            }

            // if one or both users are not registered
            else if (docs.length !== 2) {
                embed.setColor(0xff0000).setDescription('Either you or your opponent is not registered. Type ' + prefix + 'register to register');
                message.channel.send(embed);
                return;
            }

            // if both users are registered, continue on
            else {

                var inGameP1 = false;
                var inGameP2 = false;
                for (var i = 0; i <= 1; i++) {
                    for (var j = 0; j < docs[i].games.length; j++) {
                        if (docs[i].games[j].guildId === message.guild.id) {
                            if (i === 0) inGameP1 = true;
                            else inGameP2 == true;
                        }
                    }
                }

                // if one or both players are playing games in the current server
                if (inGameP1 || inGameP2) {
                    embed.setColor(0xff0000).setDescription('Either you or your opponent is already in a game in this server.');
                    message.channel.send(embed);
                    return;
                }

                // if both players are available in the same server, initialize game and player
                else {

                    const newGame = new ChessGame({
                        idGame: guidGenerator(),
                        fen: beginFen,
                        idWhite: playerWhiteId,
                        idBlack: playerBlackId
                    });
                    newGame.save().then(result => console.log(result)).catch(err => console.log(err));

                    docs[0].games.push({
                        guildId: message.guild.id,
                        idGame: newGame.idGame,
                        color: (docs[0].userId === playerWhiteId) ? 'w' :'b'
                    });
                    docs[1].games.push({
                        guildId: message.guild.id,
                        idGame: newGame.idGame,
                        color: (docs[1].userId === playerWhiteId) ? 'w' : 'b'
                    });
                    docs[0].save().then(result => console.log(result)).catch(err => console.log(err));
                    docs[1].save().then(result => console.log(result)).catch(err => console.log(err));

                    embed.setColor(0x33ff36).setTitle("Game Started")
                        .setImage("http://www.fen-to-image.com/image/24/single/coords/rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR")
                        .setDescription("Hey, <@" + playerWhiteId + ">! You are white in a new game of chess. Make the first move!\n\n`" + prefix + "move <move>`");
                    message.channel.send(embed);
                }

            }

        });


    }

}