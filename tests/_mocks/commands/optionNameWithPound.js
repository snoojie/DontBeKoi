module.exports = {

    name: "somename",

    description: "Some description",

    options: [
        { name: "some#optionname", description: "some option description" },
    ],

    execute: async function ()
    {
        return "some reply";
    }
    
};