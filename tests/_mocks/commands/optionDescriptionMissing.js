module.exports = {

    name: "somename",

    description: "Some description",

    options: [
        { name: "someoptionname" },
    ],

    execute: async function ()
    {
        return "some reply";
    }
    
};