/*
* To run:
* cmd, then path to working directory
* cd /d F: to path to F drive
* run "node ." OR "node main.js" into cmd
* profit?
*/




//required for Discord to recognize us as the bot
const Discord = require('discord.js');
const Client = new Discord.Client();

//Filesystem Require
const fs = require('fs');

//commands import and storage
Client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands/').filter(file => file.endsWith('.js'));

for(const file of commandFiles)
{
    const command = require(`./commands/${file}`);

    Client.commands.set(command.name, command)
}



//command listener prefix
const prefix = '-';

//Initiation message. Should appear in cmd as confirmation of bot/update initialization
//Initialises the bot, allowing it to actually work.
Client.once('ready', () => {
    console.log("Initiated");
});

//Command listener.
Client.on('message', message => {
    //message sanitization. We don't want infinite loops.
    if(!message.content.startsWith(prefix) || message.author.bot) return;

    //remove the prefix, then split into array of individual args, dvided by spaces 
    const args = message.content.slice(prefix.length).split(/ +/);
    
    const command = args.shift().toLowerCase();

    //execute the command
    try {
        Client.commands.get(command).execute(message,args);
        
    } catch (e) {
        console.log("Invalid Command" + e.message)
    }


});



//Client verification token. As the repository is now public, the token was regenerated and the old token removed from repo.
Client.login('');