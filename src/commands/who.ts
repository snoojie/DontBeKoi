import { CommandInteraction } from "discord.js";
import { Command } from "../command";
import { DataAccessLayer, KoiNotFound, PatternNotFound, UsersMissingKoiResponse } from "../dataAccessLayer";

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
        let usersMissingKoi: UsersMissingKoiResponse;
        try
        {
            usersMissingKoi = await DataAccessLayer.getUsersMissingKoi(COLOR, PATTERN);
        }
        catch(error)
        {
            // if the pattern or color are invalid, return that
            if(error instanceof PatternNotFound || error instanceof KoiNotFound)
            {
                return error.message;
            }

            // otherwise, throw the error up the chain
            throw error;
        }

        // start building the reply message
        // to show information about the koi
        // note that not all patterns (progressives primarily) have a known hatch time
        // <rarity> <time> <color> <pattern>
        let koiDescription: string = `${usersMissingKoi.rarity.toLowerCase()} `;
        if (usersMissingKoi.hatchTime)
        {
            koiDescription += `${usersMissingKoi.hatchTime}h `;
        }
        koiDescription += `${COLOR} ${PATTERN}`;

        // if no one needs the koi, state that
        let reply: string;
        if (usersMissingKoi.discordIds.length == 0)
        {
            reply = `Nobody needs ${koiDescription}.`;
        }

        // otherwise at least one person needs this koi,
        // so mention all discord users who need this koi
        else
        {
            const MENTIONS: string = getMentions(usersMissingKoi.discordIds);
            reply = `Needing ${koiDescription}:\n${MENTIONS}`;
        }

        // call out anyone who does not have this pattern in their spreadsheet
        reply += callOut(
            usersMissingKoi.discordIdsWithSpreadsheetErrors.patternNotFound, 
            "Could not find pattern"
        );

        // call out anyone who does not have this koi in their spreadsheet
        reply += callOut(
            usersMissingKoi.discordIdsWithSpreadsheetErrors.koiNotFound, 
            "Could not find koi, likely due to a typo,"
        );

        // call out anyone whose spreadsheet does not exist
        // this shouldn't happen unless it's been deleted
        reply += callOut(
            usersMissingKoi.discordIdsWithSpreadsheetErrors.spreadsheetNotFound,
            "Spreadsheet does not exist"
        );

        // call out anyone whose spreadsheet is private
        reply += callOut(
            usersMissingKoi.discordIdsWithSpreadsheetErrors.privateSpreadsheet,
            "Spreadsheet is private"
        );

        // call out anyone whose spreadsheet is private
        reply += callOut(
            usersMissingKoi.discordIdsWithSpreadsheetErrors.formatBroken,
            "Spreadsheet broken"
        );

        return reply;
    }

};

export default WhoCommand;

function getMentions(discordIds: string[]): string
{
    let mentionList: string[] = [];
    for (const DISCORD_ID of discordIds)
    {
        mentionList.push(`<@${DISCORD_ID}>`);
    }
    return mentionList.join(" ");
}

function callOut(discordIds: string[], reason: string): string
{
    if (discordIds.length > 0)
    {
        const MENTIONS: string = getMentions(discordIds);
        return `\n${reason} for ${MENTIONS}`;
    }
    return "";
}