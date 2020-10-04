const Discord = require('discord.js');
const ytdl = require('ytdl-core');
const search = require('youtube-search');
const config = require('../config.json');
const opts = {
    maxResults: 1,
    key: config.youtubeapi,
    type: 'video'
};

const servers = new Map();

module.exports = {

    name: 'playskipstop',
    description: 'plays, skips, and stops youtube search',

    async execute(message, command, args) {

        var embed = new Discord.MessageEmbed().setColor(0xff0000);

        // play song
        function play(connection, message, song) {

            // if no more songs to loop
            if (!song) {
                embed = new Discord.MessageEmbed().setColor(0xff0000);
                embed.setColor(0xff0000).setDescription("No more songs. End of queue!");
                message.channel.send(embed);
                connection.disconnect();
                return;
            }

            // send message
            var server = servers[message.guild.id];
            embed.setColor(0x33ff36)
                .setTitle('Now Playing')
                .setDescription("**" + song.title + '**')
                .setURL(song.link)
                .setThumbnail(song.thumbnails.default.url);
            message.channel.send(embed);

            // play and continue to play 
            server.dispatcher = connection.play(ytdl(server.queue[0].link, { filter: 'audioonly' })).on("finish", () => {
                server.queue.shift();
                play(connection, message, server.queue[0]);
            });

        }

        // PLAY
        if (command === 'play') {

            // no search term
            if (args.join('').length === 0) {
                embed.setDescription('You need to search something.');
                message.channel.send(embed);
                return;
            }

            // not in voice channel
            if (!message.member.voice.channel) {
                embed.setDescription('You need to be in a voice channel.');
                message.channel.send(embed);
                return;
            }

            // if server does not have a queue, create one
            if (!servers[message.guild.id]) {
                servers[message.guild.id] = { queue: [] };
            }

            // current server
            var server = servers[message.guild.id];

            // get search link from search query
            let result = await search(args.join(' '), opts).catch(err => console.log(err));
            if (result) {

                server.queue.push(result.results[0]);

                // add to queue if there is a song playing 
                if (server.queue.length > 1) {

                    // if botChannel != userChannel
                    if (message.member.voice.channel !== message.guild.voice.channel) {
                        embed.setDescription('You are not in the same channel as the bot.');
                        message.channel.send(embed);
                        return;
                    }

                    embed.setColor(0x33ff36)
                        .setTitle('Successfully Added to Queue')
                        .setDescription("**" + result.results[0].title + '**')
                        .setURL(result.results[0].link)
                        .setThumbnail(result.results[0].thumbnails.default.url);
                    message.channel.send(embed);

                }

            }
            else {
                message.channel.send("No results");
            }

            // if not in voice channel, join vc
            if (!message.member.voice.connection && server.queue.length === 1) {
                message.member.voice.channel.join().then(function (connection) {
                    play(connection, message, server.queue[0]);
                });
            }


        }

        // SKIP
        else if (command === 'skip') {

            // not in voice channel
            if (!message.member.voice.channel) {
                embed.setDescription('You need to be in a voice channel.');
                message.channel.send(embed);
                return;
            }

            // if bot not in voice channel
            if (!message.guild.voice.connection) {
                embed.setDescription('The bot is not in a voice channel.');
                message.channel.send(embed);
                return;
            }

            // if botChannel != userChannel
            if (message.member.voice.channel !== message.guild.voice.channel) {
                embed.setDescription('You are not in the same channel as the bot');
                message.channel.send(embed);
                return;
            }

            var server = servers[message.guild.id];
            server.queue.shift();
            play(message.guild.voice.connection, message, server.queue[0]);
        }

        // STOP
        else if (command === 'stop') {

            // not in voice channel
            if (!message.member.voice.channel) {
                embed.setDescription('You need to be in a voice channel.');
                message.channel.send(embed);
                return;
            }

            // if bot not in voice channel
            if (!message.guild.voice.connection) {
                embed.setDescription('The bot is not in a voice channel.');
                message.channel.send(embed);
                return;
            }

            // if botChannel != userChannel
            if (message.member.voice.channel !== message.guild.voice.channel) {
                embed.setDescription('You are not in the same channel as the bot');
                message.channel.send(embed);
                return;
            }

            var server = servers[message.guild.id];
            for (var i = server.queue.length - 1; i >= 0; i--) {
                server.queue.splice(i, 1);
            }
            server.dispatcher.destroy();
            embed.setDescription("Media stopped. Queue deleted.");
            message.channel.send(embed);
            message.guild.voice.connection.disconnect();

        }

        else if (command === 'queue') {

            // if server does not have a queue, create one
            if (!servers[message.guild.id] || servers[message.guild.id].queue.length === 0) {
                embed.setDescription("No queue!");
                message.channel.send(embed);
            }

            var output = "";
            for (var i = 0; i < servers[message.guild.id].queue.length; i++) {
                output += "**" + (i + 1) + ".** " + servers[message.guild.id].queue[i].title + "\n";
            }
            embed.setColor(0x33ff36).setTitle("Current Queue").setDescription(output);
            message.channel.send(embed);

        }

    }

}
