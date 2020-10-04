const Discord = require('discord.js')
const Player = require('../models/player.js');

module.exports = {

    name: 'register',
    description: 'registers player to become available',

    execute(message, args) {

        var embed = new Discord.MessageEmbed();

        Player.findOne({ userId: message.author.id }, (errPlayer, user) => {

            // error handling
            if (errPlayer) {
                console.log(errPlayer);
            }

            // if user is not registered
            else if (!user) {

                const newPlayer = new Player({
                    userId: message.author.id,
                    games: []
                });

                newPlayer.save().then(err => console.log(err));

                embed.setColor(0x33ff36).setDescription('<@' + message.author.id + '>, you are now registered and eligible to invite others and be invited to chess games.');
                message.channel.send(embed);
                return;

            }

            // if user is already registered
            else {
                embed.setColor(0xff0000).setDescription('<@' + message.author.id + '>, you are already registered.');
                message.channel.send(embed);
                return;
            }

        });

    }

}