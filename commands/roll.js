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
    * 
    * (x)@(y)   -> evaluate again the expression x recursively and return the sum of all evaluations, provided that the higest possible result has occured,
    * AND condition y has to be true. The y condition is evaluated every time in the recursion chain.
    * Note that the implementation has to ensure that either: x has multiple 'states' it can end up in OR y can turn false.
    * 
    * (x)!(y) -> evaluate again the expression x recursively and return the sum of all evaluations, provided that condition y is true.
    * The y condition is evaluated every time in the recursion chain.
    * Note that the implementation has to ensure that y can turn false.
    * 
    * (x)?(y):(z) -> the classic ternary operator. if x, eval y. else, eval z. (x)?(y) is equivalent to (x)?(y):(0)
    * 
    * Note that if the ()!(), ()@(), or ()?():() are used inside of a greater pattern, they have to be used in parentheses.
    */

    



    //Returns whether a macro is a vaid one for the roll() function.

    //There technically COULD be a regex for this, but i'd advise for keeping this code anyways (even if as a comment).
    //Because the regex for this would be a *nightmare*
    validateMacro(macro)
    {
        //retval flags
        let flags =
        {
            isValid: true,
            GreatestPossibleValue: undefined,
            LowestPossibleValue: undefined
        }


        //current depth
        let depth = 0;
        //these blocks hold the 'macro' for recursive calls
        let blocks = [];
        //we need to identify the blocks start and end.
        let start = 0, end = 0;

        //Current operator. We want value here to be accesible to modification via other functions, so we set up a "pass-by-reference"
        let operator = {value: ""};

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
            //All stuff at depth > 0 should be ignored - a recursive call will handle it. At depth < 0 we immediately return an invalid expression. Therefore we only consider at depth == 0
            else if(depth == 0)
            {
                flags.isValid = this.validateOperators(operator,input[i]);
            }
        }
        //flags of the inner blocks.
        let innerFlags = [];
        //We need to hold the indexes in both blocks[] and innerflags[] to be the same, for some operators.
        for(let i = 0; i < blocks.length; i++)
        {
            innerFlags.push(this.validateMacro(blocks[i]));
        }
        //if any of inner macros are invalid, this is as well, so we can return already.
        for(const flag of innerFlags)
        {
            this.flags.isValid = this.flags.isValid && flag.isValid;
        }
        if(!flags.isValid)
        {
            return flags;
        }


    
    },


    //Are operators in a macro valid? IF not, macro is invalidated anyway. But  operator validation is too long to be inside validateMacro()
    validateOperators(operator, character)
    {
        //if we found a valid operator
        if  
        ( 
        character == '!' ||
        character == '@' ||
        character == '?' ||
        character == '+' ||
        character == '-' ||
        character == '*' ||
        character == '/' ||
        character == '%' ||
        character == 'd' ||                   
        character == 'k' 
        )
        {   
            //If there are multiple 'main' operators, invalidate it. They should be in brackets, to avoid confusion about the order of operations.
            if(operator.value == '')
                operator.value = character;
            else
            {
                return false;;
            }
        }
        //sometimes an operator accepts a third operand. A 'secondary' operator is then required to note that. Ex. (3)d(6)h(1) should be valid
        else if (character == 'h' || character == 'w' || character == 'l' || character == 'n')
        {
            if(operator.value != 'd' && operator.value != 'k')
            {
                return false;
            }
        }
        else if (character == ':')
        {
            if(operator.value != '?')
            {
                return false;
            }
        }
        //We accept only operators (handled above) and numbers. 
        else if (!Number.isInteger(parseInt(character)))
        {
            return false;
        }
        //If there are numbers, why? Is it a constant? Or is this an invalid (2)d6(8) 
        else if (operator.value != '')
        {
            return false;
        }
        //we have a number literal, alone, without any operator therefore the number *is* the operator.
        else
        {
             
        }
        //All clear.
        return true;
    },

    //I have no idea how to do it 'clean', wihout repeating *some* chcecks...
    validateOperands(operator,innerFlags,constant)
    {
        let flags = 
        {
            isValid: true,
            GreatestPossibleValue: undefined,
            LowestPossibleValue: undefined
        }

        // + - * / % ! @ d\k h\w l\n ?\:
        switch (operator.value) {
            case '+':
                break;
            case '-':
                break;
            case '*':
                break;
            case '/':
                break;    
            case '%':
                break;    
            case '!':
                break;    
            case '@':
                break;
            // 'd and 'k' are the same operator    
            case 'd':
            case 'k':
                break;    
            case '%':
                break;    
            //number
            default:
                flags.GreatestPossibleValue;
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

        //validateDieExpression tests

        //validateMacro tests

        //roll tests
    }
}



