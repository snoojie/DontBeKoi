module.exports = {

    name: "somename",

    description: "Some description",

    options: [
        { name: "some option name", description: "some option description" },
    ],

    execute: async function ()
    {
        return "some reply";
    }
    
};