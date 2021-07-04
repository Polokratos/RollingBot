module.exports = {
    name: 'ping',
    description: 'A ping command. Bot should respond with "pong!"',

    execute(message,args)
    {
        message.channel.send(ping(args));
        return;
    },

    ping(args)
    {
        return 'pong!';
    },

    test()
    {
        //basically just whatever goes in there *should* result in "pong!"
        console.assert(this.ping("")   === 'pong!');
        console.assert(this.ping(34)   === 'pong!');
        console.assert(this.ping(null) === 'pong!');
        console.assert(this.test(Number.NaN) === 'pong!');
        let val0 = ["-d","3d6", "CENSORED"];
        console.assert(this.test(val0) === 'pong!');

    }
}