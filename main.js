const Discord = require('discord.js');
const config = require('./config.json');
const client = new Discord.Client();
const prefix = config.prefix;
const url = config.mongoURL;
const botToken = config.token;

const fs = require('fs');
client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands/').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}

const mongoose = require('mongoose');
mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

function getUser(mention) {
    if (!mention) return null;
    if (mention.startsWith('<@') && mention.endsWith('>')) {
        mention = mention.slice(2, -1);
        if (mention.startsWith('!')) {
            mention = mention.slice(1);
        }
        return client.users.cache.get(mention);
    }
}

client.once('ready', () => {
    console.log('Bot Online');
});

client.on('message', async message => {

    // message doesn't start with prefix or message is from bot
    if (!message.content.startsWith(prefix) || message.author.bot)
        return;

    // parameters after command
    const args = message.content.slice(prefix.length).split(/ +/);

    // command keyword 
    const command = args.shift().toLowerCase();

    // HELP
    if (command === 'help') {
        var strings = "**General**\n\n`" + prefix + "help` - Help menu\n`[teams <numberOfTeams> <@users>` - Creates random teams\n" +
            "\n**Chess**\n\n`" + prefix + "register` - Registers the user and allows the user to invite others and be invited to chess games\n" +
            "`" + prefix + "startgame <w/b> <@opponent>` - Creates a chess game with an opponent, w / b is your color\n" +
            "`" + prefix + "start960 <w/b> <@opponent>` - Creates a Chess960 game with an opponent, w/b is your color\n" +
            "`" + prefix + "move <move>` - Makes a move, move must be in Long or Standard Algebraic Notation (e2-e4, f1g3, Ke3, Nxa4+, etc.)\n" +
            "`" + prefix + "draw` - Proposes a draw for the current game (opponent must accept for game to be drawn)\n" +
            "`" + prefix + "resign` - Resigns the game on the spot\n" +
            "\n**Media**\n\n`" + prefix + "play <search words>` - Plays searched media from YouTube, user must be in voice channel\n" +
            "`" + prefix + "queue` - Shows the current queue\n" +
            "`" + prefix + "skip` - Skips the current song\n" +
            "`" + prefix + "stop` - Stops the entire queue\n";
        message.channel.send(new Discord.MessageEmbed().setColor("0xffff00").setTitle('Bot Commands').setDescription(strings));
    }

    // TEAMS
    else if (command === "teams") {
        client.commands.get('teams').execute(message, args);
    }

    // REGISTER
    else if (command === "register") {
        client.commands.get('register').execute(message, args);
    }

    // STARTGAME
    else if (command === "startgame" || command === "start960") {

        var embed = new Discord.MessageEmbed().setColor(0xff0000);

        // correct command format
        if (args.length !== 2 || (args[0].toLowerCase() !== 'w' && args[0].toLowerCase() !== 'b')) {
            embed.setDescription('Enter in this form: ' + prefix + 'startgame w/b @user');
            message.channel.send(embed);
            return;
        }

        // if no user is entered
        if (getUser(args[1]) === undefined) {
            embed.setDescription('Please mention a user to play against.');
            message.channel.send(embed);
            return;
        }

        // if you are trying to play against yourself
        if (getUser(args[1]) === message.author) {
            embed.setDescription('You cannot play yourself. Go outside; get some sun.');
            message.channel.send(embed);
            return;
        }

        if (command === "startgame") {
            // normal game
            client.commands.get('startgame').execute(message, "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
                (args[0].toLowerCase() === 'w') ? message.author.id : getUser(args[1]).id,
                (args[0].toLowerCase() === 'b') ? message.author.id : getUser(args[1]).id);
        }
        else {
            // chess960 shuffle
            String.prototype.shuffle = function () {
                var a = this.split(""),
                    n = a.length;

                for (var i = n - 1; i > 0; i--) {
                    var j = Math.floor(Math.random() * (i + 1));
                    var tmp = a[i];
                    a[i] = a[j];
                    a[j] = tmp;
                }
                return a.join("");
            };
            var shuffled = "rnbqkbnr".shuffle();
            client.commands.get('startgame').execute(message, shuffled + "/pppppppp/8/8/8/8/PPPPPPPP/" + shuffled.toUpperCase() + " w - - 0 1",
                (args[0].toLowerCase() === 'w') ? message.author.id : getUser(args[1]).id,
                (args[0].toLowerCase() === 'b') ? message.author.id : getUser(args[1]).id);
        }
        
    }

    // MOVE
    else if (command === "move") {
        client.commands.get('move').execute(message, args);
    }

    // RESIGN
    else if (command === "resign") {
        client.commands.get('resign').execute(message, args);
    }

    // DRAW
    else if (command === 'draw') {
        client.commands.get('draw').execute(message, args);
    }

    // PLAY
    else if (command === 'play' || command === 'skip' || command === 'stop' || command === 'queue') {
        client.commands.get('playskipstop').execute(message, command, args);
    }

});

client.login(botToken);