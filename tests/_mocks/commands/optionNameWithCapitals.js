module.exports = {

    name: "somename",

    description: "Some description",

    options: [
        { name: "someOptionName", description: "some option description" },
    ],

    execute: async function ()
    {
        return "some reply";
    }
    
};