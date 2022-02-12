module.exports = {

    name: "somename",

    description: "Some description",

    options: [
        { 
            name: "someoptionname", 
            description: 6
        },
    ],

    execute: async function ()
    {
        return "some reply";
    }
    
};