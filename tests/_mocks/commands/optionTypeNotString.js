module.exports = {

    name: "somename",

    description: "Some description",

    options: [
        { name: "someoptionname", description: "some option description", type: 1 },
    ],

    execute: async function ()
    {
        return "some reply";
    }
    
};