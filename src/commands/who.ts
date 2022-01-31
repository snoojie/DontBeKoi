import { CommandInteraction } from "discord.js";
import { Command } from "../command";
//import KoiDal from "../database/dataAccessLayers/koi";
//import PatternDal from "../database/dataAccessLayers/pattern";

const WhoCommand: Command = {

    name: "who",

    description: "List everyone who needs a specific koi.",

    options: [
        { name: "color",   description: "Koi's color."   },
        { name: "pattern", description: "Koi's pattern." }
    ],
    
    execute: async function (interaction: CommandInteraction): Promise<string> {

        // get values of the options
        const COLOR: string = interaction.options.getString("color") || "";
        const PATTERN: string = interaction.options.getString("pattern") || "";

        
        
        return COLOR + ": " + PATTERN;
    }

};

export default WhoCommand;