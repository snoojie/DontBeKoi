module.exports = {

    name: "somename",

    description: "Some description",

    options: [
        { name: "namethatisverylongjusttoolongwaytoolong", description: "some option description" },
    ],

    execute: async function ()
    {
        return "some reply";
    }
    
};