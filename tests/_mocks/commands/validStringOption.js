module.exports = {

    name: "stringcommand",

    description: "This command has a string option.",

    options: [ { name: "stringoption", description: "option with string value" } ],

    execute: async function ()
    {
        return "some reply";
    }
    
};