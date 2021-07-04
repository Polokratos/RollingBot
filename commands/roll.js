module.exports = {
    name: 'roll',
    description: 'rolls a dice expression',

    execute(message,args)
    {
        
        message.channel.send(this.roll(args));
        
        return;
    },

    roll(args)
    {
        
        var rollResult = 0;
        //individual rolls, packaged into a string.
        var Rolls = "";

        for(const arg of args)
        {   
            try
            {  
                //Input sanitization - divide args to dice. That is "3d6 or 3k6" becomes 3 6-sided dice. 
                //Why k AND d? K => Kość, Polish for Dice. This bot is expectd to be used by Polish speakers.
                var diceSet = arg.toLowerCase().split(/[kd]/,2);
                var diceAmount = parseInt(diceSet[0]);
                // we want "d6" to be equivalent to "1d6"
                var diceSides = diceSet[0] === "" ? 1 : parseInt(diceSet[1]);
                if(Number.isNaN(diceAmount) || Number.isNaN(diceSides))
                    throw 'Parameter is not a number';
            } catch (e) //if input bad, userside throws the bad argument, console logs everything.
            {
                message.channel.send(`Invalid argument: ${arg}. Command invalidated.`);
                console.log(`Roll failed. Message: ${message} Args: ${args} Error was thrown when sanitising following argument: ${arg} Exception: ${e} `);
            }
            
            //Roll the dice! (for this argument)
            for(let i = 0; i < diceAmount; i++)
            {
                //result of one throw of one die.
                var result = Math.floor( (Math.random() * diceSides) + 1);

                //totals
                rollResult += result;
                Rolls += result;
                Rolls += " + ";

            }

        }
        //clears the last  "+ " from the bot response. That is, a message : "2 + 2 + 2 +  Total: 6" becomes "2 + 2 + 2 Total: 6"
        Rolls = Rolls.slice(0, (Rolls.length - 2) );

        return Rolls + "Total:" + rollResult;
    }
}