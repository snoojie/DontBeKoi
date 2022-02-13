module.exports = {

    name: "stringcommandwithtype",

    description: "This command has a string option and defined type.",

    options: [{ 
        name: "stringoption", description: "option with string value", type: "string" 
    }],

    execute: async function ()
    {
        return "some reply";
    }
    
};