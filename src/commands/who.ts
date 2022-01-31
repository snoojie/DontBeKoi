import { CommandInteraction } from "discord.js";
import { Command } from "../command";
import { DataAccessLayer, UsersMissingKoiResponse } from "../database/dataAccessLayer";

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
        
        const RESPONSE: UsersMissingKoiResponse = 
            await DataAccessLayer.getUsersMissingKoi(COLOR, PATTERN);

        if (RESPONSE.error)
        {
            return RESPONSE.error;
        }

        const DATA = RESPONSE.data!;

        const KOI_DESCRIPTOR: string = 
            `${DATA.rarity.toLowerCase()} ${COLOR} ${PATTERN}`;

        if (DATA.discordIds.length == 0)
        {
            return `Nobody needs ${KOI_DESCRIPTOR}.`;
        }

        let mentions: string[] = [];
        for (const DISCORD_ID of DATA.discordIds)
        {
            mentions.push(`<@${DISCORD_ID}>`);
        }

        return `Needing ${KOI_DESCRIPTOR}:\n${mentions.join(", ")}`;
    }

};

export default WhoCommand;