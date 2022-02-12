module.exports = {

    name: "somename",

    description: "Some description",

    options: [
        { name: 5, description: "some option description" },
    ],

    execute: async function ()
    {
        return "some reply";
    }
    
};