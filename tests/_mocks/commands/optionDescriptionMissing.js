module.exports = {

    name: "somename",

    description: "Some description",

    options: [
        { name: "someoption" },
    ],

    execute: async function ()
    {
        return "some reply";
    }
    
};