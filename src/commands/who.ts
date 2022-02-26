import type { CommandInteraction } from "discord.js";
import type { Command } from "../command";
import { DataAccessLayer, KoiNotFound, NeitherPatternFound, UsersMissingKoiResponse } 
    from "../dataAccessLayer";

const WhoCommand: Command = {

    name: "who",

    description: "List everyone who needs a specific koi.",

    options: [ { name: "koi", description: "Koi's name and pattern." } ],
    
    execute: async function (interaction: CommandInteraction): Promise<string> {

        // get the koi info the user entered, such as
        // shishiro inazuma
        const KOI_INFO: string = interaction.options.getString("koi")!;

        // confirm that two names were provided
        const NAMES: string[] = KOI_INFO.split(" ");
        if (NAMES.length != 2)
        {
            return "Provide both the koi name and pattern, " + 
                "for example: shishiro inazuma";
        }

        let usersMissingKoi: UsersMissingKoiResponse | undefined;
        try
        {
            usersMissingKoi = 
                await DataAccessLayer.getUsersMissingKoi(NAMES[0]!, NAMES[1]!);
        }
        catch(error)
        {
            if (error instanceof NeitherPatternFound || error instanceof KoiNotFound)
            {
                return error.message;
            }

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
        koiDescription += KOI_INFO;

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
            "Could not find koi"
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

        // call out anyone whose spreadsheet is broken
        // for example, there could be an extra row, or sheets are renamed
        reply += callOut(
            usersMissingKoi.discordIdsWithSpreadsheetErrors.formatBroken,
            "Spreadsheet formatting broken"
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