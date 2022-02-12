let badCommand = {

    name: "somename",

    description: "Some description",

    options: [],

    execute: async function ()
    {
        return "some reply";
    }
    
};

for (let i=0; i<26; i++)
{
    badCommand.options.push({
        name: `option${i}`,
        description: `option number ${i}`
    });
}

module.exports = badCommand;