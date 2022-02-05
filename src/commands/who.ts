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
        
        // get everyone who does not have this koi
        const USERS_MISSING_KOI: UsersMissingKoiResponse =
            await DataAccessLayer.getUsersMissingKoi(COLOR, PATTERN);

        // start building the reply message
        // to show information about the koi
        // <rarity> <color> <pattern>
        const KOI_DESCRIPTOR: string = 
            `${USERS_MISSING_KOI.rarity.toLowerCase()} ${COLOR} ${PATTERN}`;

        // if no one needs the koi, return that
        if (USERS_MISSING_KOI.discordIds.length == 0)
        {
            return `Nobody needs ${KOI_DESCRIPTOR}.`;
        }

        // at least one person needs this koi
        let mentions: string[] = [];
        for (const DISCORD_ID of USERS_MISSING_KOI.discordIds)
        {
            mentions.push(`<@${DISCORD_ID}>`);
        }

        return `Needing ${KOI_DESCRIPTOR}:\n${mentions.join(" ")}`;
    }

};

export default WhoCommand;