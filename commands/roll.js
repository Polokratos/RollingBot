module.exports = {
    name: 'roll',
    description: 'rolls a dice expression',

    execute(message,args)
    {
        
        message.channel.send(this.rollold(args));
        
        return;
    },

    rollold(args)
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
    },

    /*
    * Design-doc comment. Shut up it's fine!
    * okay, what args do ew want were, what complexity etc?
    * The "basic arg" should be 'x'd'y'; eg 3d6 or 4d20. Note: d6 and 1d6 shouyld be equivalent.
    */

    roll(args)
    {
        throw "Not Yet Implemented!";
        let retval =
        {
            totalRolled: 0,
            individualRolls: []
        }

        return retval;
    },

    test()
    {
        /*
        * Basic test structure: 
        * Set the arguments.
        * Run the function.
        * Assert that the returns match the expectations.
        */
        let testargs = ["1d2"]
        let testval = this.roll(testargs);

        console.assert(Number.isInteger(testval.totalRolled));
        console.assert(testval.individualRolls.length == 1)
        for(const roll of testval.individualRolls)
        {
            console.assert(Number.isInteger(roll));
            console.assert(roll >= 1);
            console.assert(roll <= 2);
        }


        testargs = ["3d6 4d8 d20"]
        testval = this.roll(testargs);
        
        console.assert(Number.isInteger(testval.totalRolled));
        console.assert(testval.individualRolls.length == (3 + 4 + 1) );
        for(let i = 0; i < testval.individualRolls.length; i++)
        {
            console.assert(Number.isInteger(testval.individualRolls[i]))
            console.assert(testval.individualRolls[i] >= 1);
            if(i < 3)
            {
                console.assert(testval.individualRolls[i] <= 6);
            }
            else if (i < 7)
            {
                console.assert(testval.individualRolls[i] <= 8);
            }
            else
            {
                console.assert(testval.individualRolls[i] <= 20);
            }
        }
        


    }
}