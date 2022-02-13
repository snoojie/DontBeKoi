module.exports = {

    name: "numbercommand",

    description: "This command has a number option.",

    options: [{ 
        name: "numberoption", description: "option with number value", type: "number" 
    }],

    execute: async function ()
    {
        return "some reply";
    }
    
};