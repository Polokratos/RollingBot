const { UserFlags } = require("discord.js");

module.exports = {
    name: 'roll',
    description: 'rolls a dice expression',

    // I Do not expect anything to call anything from here except for execute() or test().
    // Everything else is 'private' but Lord help me how to enfore that.

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
    * The "basic arg" should be x'd'y, where x and y are integers; eg 3d6 or 4d20. Note: d6 and 1d6 should be equivalent.
    * Honestly, "4d6 5d8" => sum of 4 6-sided dice and 5 8-sided ones sounds fine in thory, but suucks in practice. 
    * ... Yes we need regex for dice. No, that ends up just being Roll20. Wchich is shit. We need better macro control, with conditions!
    * We can't do variables (ig we can, but that would require creating a js parser)... and we all know that eval() is dangerous.
    * So let's not be stupid, and do it smart. 
    * 
    * 
    * Therefore, regular math rules apply.
    * Hovever: NO ORDER OF OPERATIONS! Parentheses order is the ONLY one holding!
    * Any expression evaluating to > 0 is considered a true condition.
    * Any expression evaluating to =< 0 is considered a false condition.
    * 
    * standard math operators:
    * ()+() ()-() ()*() ()/() ()%() 
    * Their purpose is known.
    * Extra operators we need to apply.
    * 'd'(ice) OR 'k'(ość)    -> roll the dice ex. ()d() / ()k()
    * 'h'(igh) OR 'w'(ysoki)    -> keep the highest results. ex. ()d()h() / ()k()w()
    * Would be used in this way: 3d4h1 would take the highest result of 3 rolls of a d4. 3d4h2 would take the highest 2 (drop the lowest).
    * 'l'(ow) OR 'n'(iski)  -> same as above, but keep lowest. ex. ()d()l() / ()k()n()
    * (x)@(y)   -> evaluate again the expression x recursively and return the sum of all evaluations, provided that x > y.
    * This allows fe. a mechanic where on max result a roll is repeated. Or on min result.
    * Note that the implementation has to ensure that either: x has multiple 'states' it can end up in OR y can turn false.
    * 
    * (x)!(y) -> evaluate again the expression x recursively and return the sum of all evaluations, provided that condition y is true.
    * The y condition is evaluated every time in the recursion chain.
    * Note that the implementation has to ensure that y can turn false.
    * 
    * (x)?(y):(z) -> the ternary operator. if x, eval y. else, eval z. (x)?(y) is equivalent to (x)?(y):(0)
    * 
    * Note that if the ()!(), ()@(), or ()?():() are used inside of a greater pattern, they have to be used in parentheses.
    */

    

    

    //Returns whether a macro is a vaid one for the roll() function.
    validateMacro(macro)
    {
        //retval flags
        let flags =
        {
            isValid: true,
            GreatestPossibleValue: undefined,
            LowestPossibleValue: undefined
        }
        //firstly, check the primitive macro. 
        if(Number.isFinite(macro))
        {
            flags.GreatestPossibleValue = macro;
            flags.LowestPossibleValue = macro;
            return flags;
        }
        
        
        //current depth
        let depth = 0;
        //these blocks hold the 'macro' for recursive calls
        let blocks = [];
        //we need to identify the blocks start and end.
        let start = 0, end = 0;
        //flags of the inner blocks.
        let innerFlags = [];
        // The top - level operator(s) of this macro
        let operators = [];


        //We scan the entire macro for intermiedary steps etc.
        for(let i = 0; i < input.length; i++)
        {
            if(input[i] == '(')
            {   
                //going from depth 0 to depth 1 => new block.
                if(depth == 0)
                {
                    start = i+1; //don't include the opening bracket in the block.. Eg. (3)d(6) should recursively check 3 and 6, not (3) and (6).
                }
                depth++;
            }
            else if(input[i] == ')')
            {
                depth--;
                //depth from 1 to 0 => end of a block.
                if(depth == 0)
                {
                    end = i-1; //don't include the ending bracket in the block. Eg. (3)d(6) should recursively check 3 and 6, not (3) and (6).
                    
                    blocks.push(input.slice(start,end));
                }
                //A closing bracket without a corresponding opening bracket beforehand.
                else if(depth < 0)
                {
                    flags.isValid = false;
                }
                return flags;
            }
            //Scan for operators / constants at depth == 0
            else if(depth == 0)
            {
                operators.push(input[i]);
            }
        }

        //We need to hold the indexes in both blocks[] and innerflags[] to be the same, for some operators.
        for(let i = 0; i < blocks.length; i++)
        {
            innerFlags.push(this.validateMacro(blocks[i]));
        }
        
        this.validateTopLevelOfMacro(flags,operators,innerFlags);
    
    },

    validateTopLevelOfMacro(flags, operators, innerFlags)
    {
        if(innerFlags.length != operators.length)
        switch (operators[0]) {
            case "+":
                break;
            case "-":
                break;
            case "*":
                break;
            //we can allow for division in both ways.
            case "\\":
            case "/":
                break;
            case "d":
            case "k":
                break;
            case "@":
                break;
            case "!":
                break;
            case "?":
                break;
            
            
            // No operators. Would happer in sth like (3)(4), which is invalid. 
            // But also in sth like ((3)), wchich is valid.
            // The key is that in ((3)), there is precisely one inner flag. And we can just copy that, since ((3)) === (3) === 3
            case undefined:
                if(innerFlags.length == 1)
                {
                    flags == innerFlags[0];
                }
                else
                {
                    flags.isValid = false;
                }
                break;
            //Unknown operator
            default:
                flags.isValid = false;
                break;
        }
    },
    




    roll(args)
    {
        throw "Not Yet Implemented!";
    },

    rollDie(sides)
    {
        return Math.floor( (Math.random() * sides) + 1);
    },

    test()
    {
        //rollDie tests
        console.assert(Number.isInteger(this.rollDie(2)));
        console.assert(this.rollDie(2) >= 1);
        console.assert(this.rollDie(2) <= 2);
        console.assert(Number.isInteger(this.rollDie(20)));
        console.assert(this.rollDie(20) >= 1);
        console.assert(this.rollDie(20) <= 20);

        let randomInt = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
        console.assert(Number.isInteger(this.rollDie(randomInt)));
        console.assert(this.rollDie(randomInt) >= 1);
        console.assert(this.rollDie(randomInt) <= randomInt);

        //validateDieExpression tests

        //validateMacro tests

        //roll tests
    }
}



