module.exports = {

    name: "somename",

    description: "Some description",

    options: [
        { name: "someoptionname", description: "some option description", type: "" },
    ],

    execute: async function ()
    {
        return "some reply";
    }
    
};