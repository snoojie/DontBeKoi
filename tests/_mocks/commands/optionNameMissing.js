module.exports = {

    name: "somename",

    description: "Some description",

    options: [
        { description: "some option description" },
    ],

    execute: async function ()
    {
        return "some reply";
    }
    
};