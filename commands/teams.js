const Discord = require('discord.js');

module.exports = {

    name: 'teams',
    description: 'make random teams',

    execute(message, args) {

        var embed = new Discord.MessageEmbed();

        // ensure correct command format
        if (args.length <= 1 || isNaN(parseInt(args[0]))) {
            embed.setColor(0xff0000).setDescription('Enter in this form: [teams <numberOfTeams> <players>');
            message.channel.send(embed);
            embed = new Discord.MessageEmbed();
            return;
        }

        var numTeams = args.shift();

        // teams >= 1
        if (numTeams <= 0) {
            embed.setColor(0xff0000).setDescription('Please enter a positive number for the number of teams.');
            message.channel.send(embed);
            embed = new Discord.MessageEmbed();
            message.channel.send();
            return;
        }

        // players >= teams
        if (numTeams > args.length) {
            embed.setColor(0xff0000).setDescription('Less players than teams.');
            message.channel.send(embed);
            embed = new Discord.MessageEmbed();
            return;
        }

        var teamArray = new Array(numTeams);

        // random shuffle
        for (let i = args.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [args[i], args[j]] = [args[j], args[i]];
        }

        for (let i = 0; i < args.length; i++) {
            if (i < numTeams)
                teamArray[i] = "**Team " + (i + 1).toString() + ": **" + args[i] + " ";
            else
                teamArray[i % numTeams] += args[i] + " ";
        }

        var result = "";
        for (let i = 0; i < numTeams; i++)
            result += teamArray[i] + "\n";

        embed.setTitle('Randomized Teams')
            .setColor(0x33ff36)
            .setDescription(result);
        message.channel.send(embed);
        embed = new Discord.MessageEmbed();

    }

}