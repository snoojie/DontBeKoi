module.exports = {

    name: "somename",

    description: "Some description",

    options: [
        { 
            name: "someoptionname", 
            description: "some option description", 
            type: "unknowntype"
        },
    ],

    execute: async function ()
    {
        return "some reply";
    }
    
};