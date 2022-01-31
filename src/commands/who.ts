import { CommandInteraction } from "discord.js";
import { Command } from "../command";
import DataAccessLayer from "../database/dataAccessLayer";

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

        // validate the pattern and color
        if (!(await DataAccessLayer.validatePattern(PATTERN)))
        {
            return `Pattern ${PATTERN} does not exist.`;
        }
        if (!(await DataAccessLayer.validateKoi(COLOR, PATTERN)))
        {
            return `Pattern ${PATTERN} does not have color ${COLOR}.`;
        }
        
        const USERS_MISSING_KOI = 
            await DataAccessLayer.getDiscordUsersMissingKoi(COLOR, PATTERN);

        return "Users: " + USERS_MISSING_KOI.join(",");
    }

};

export default WhoCommand;