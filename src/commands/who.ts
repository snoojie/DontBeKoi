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

        // Otherwise at least one person needs this koi,
        // so mention all discord users who need this koi.
        else
        {
            let userMentions: string[] = [];
            for (const DISCORD_ID of usersMissingKoi.discordIds)
            {
                userMentions.push(`<@${DISCORD_ID}>`);
            }

            // randomize the list of users
            // this will eliminate the need to roll a dice if no one claims
            for (let i = userMentions.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [userMentions[i], userMentions[j]] = [userMentions[j]!, userMentions[i]!];
            }
            
            reply = `Needing ${koiDescription}:\n${userMentions.join(" ")}`;
        }

        // call out anyone who has errors in their spreadsheet
        for (const [DISCORD_ID, ERROR_MESSAGE] of Object.entries(usersMissingKoi.errors))
        {
            reply += `\n<@${DISCORD_ID}>: ${ERROR_MESSAGE}`;
        }

        return reply;
    }

};

export default WhoCommand;