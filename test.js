/*
* The test suite is deprecated. For now.
* I can't be bothered to emulate a websocket or sth to create good unit tests.
*/


console.log("Test suite activated.");


const { assert } = require('console');
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

var commandArray = ["empty","ping","roll"];

//For each command check if it has been loaded, then run its test suite.
for(const command of commandArray)
{
    console.assert(Client.commands.has(command));
    console.assert(Client.commands.get(command).test() == true);
}
console.log("Test suite completed");