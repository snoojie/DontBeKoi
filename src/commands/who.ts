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
        // note that not all patterns (progressives primarily) have a known hatch time
        // <rarity> <time> <color> <pattern>
        let koiDescription: string = `${USERS_MISSING_KOI.rarity.toLowerCase()} `;
        if (USERS_MISSING_KOI.hatchTime)
        {
            koiDescription += `${USERS_MISSING_KOI.hatchTime}h `;
        }
        koiDescription += `${COLOR} ${PATTERN}`;

        // if no one needs the koi, state that
        let reply: string;
        if (USERS_MISSING_KOI.discordIds.length == 0)
        {
            reply = `Nobody needs ${koiDescription}.`;
        }

        // otherwise at least one person needs this koi,
        // so mention all discord users who need this koi
        else
        {
            const MENTIONS: string[] = getMentions(USERS_MISSING_KOI.discordIds);
            reply = `Needing ${koiDescription}:\n${MENTIONS.join(" ")}`;
        }

        // if anyone didn't have this pattern in their spreadsheet,
        // call them out
        if (USERS_MISSING_KOI.discordIdsMissingPattern.length > 0)
        {
            const MENTIONS: string[] = 
                getMentions(USERS_MISSING_KOI.discordIdsMissingPattern);
            reply += `\nCould not find pattern for ${MENTIONS.join(" ")}`;
        }

        return reply;
    }

};

export default WhoCommand;

function getMentions(discordIds: string[]): string[]
{
    let mentions: string[] = [];
    for (const DISCORD_ID of discordIds)
    {
        mentions.push(`<@${DISCORD_ID}>`);
    }
    return mentions;
}