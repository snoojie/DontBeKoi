module.exports = {

    name: "somename",

    description: "Some description",

    options: [
        { name: "someoption", description: "first option"     },
        { name: "someoption", description: "duplicate option" }
    ],

    execute: async function ()
    {
        return "some reply";
    }
    
};