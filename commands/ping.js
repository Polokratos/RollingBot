module.exports = {
    name: 'ping',
    description: 'A ping command. Bot should respond with "pong!"',

    execute(message,args)
    {
        message.channel.send('pong!');
        return;
    }
}