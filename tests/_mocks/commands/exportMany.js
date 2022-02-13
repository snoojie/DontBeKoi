let command = {

    name: "validcommand",

    description: "This command is valid.",

    execute: async function ()
    {
        return "some reply";
    }
    
};

// prevents the several exports from being put on default
Object.defineProperty(exports, "__esModule", { value: true });

exports.firstExport = command;
exports.secondExport = 3;