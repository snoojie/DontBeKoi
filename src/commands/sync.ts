import { CommandInteraction } from "discord.js";
import { UserKoiSpreadsheet, KoiProgress, KoisProgress } from "../google/userKoiSpreadsheet";
import { KoiRequest, KoiCommand, KoiCommandPrivateError, KoiCommandPublicError } from "../structures/command/koiCommand";

class SyncCommand extends KoiCommand
{
    constructor()
	{
        super("sync", "Update google spreadsheet from discord emojis");
	}

	public async execute(interaction: CommandInteraction): Promise<void>
    {
        await interaction.deferReply();

        // pattern as provided by the discord user
        const PATTERN = this.getOptionValuePattern(interaction);

        // get list of koi from google sheet that are not marked as owned or ascended
        let userKoiSpreadsheet: UserKoiSpreadsheet = new UserKoiSpreadsheet();
        await userKoiSpreadsheet.connect("1cUG1W7nqyLyZyeXRp_OH9Q-rIjjLTaSdftedK56-4U0");
        const MISSING_KOIS: KoisProgress | undefined = 
            userKoiSpreadsheet.getMissingKois(PATTERN);
        if (!MISSING_KOIS)
        {
            await this.replyWithError(
                interaction, `Pattern ${PATTERN} is not in your google spreadsheet.`
            );
            return;
        }
        let missingKoiNames: string[] = [];
        for (const MISSING_KOI_NAME in MISSING_KOIS)
        {
            missingKoiNames.push(MISSING_KOI_NAME);
        }

        // get these missing koi from the channel
        let koiRequests: KoiRequest[] | undefined = undefined;
        try
        {
            koiRequests = await this.getKoiRequests(interaction, PATTERN, missingKoiNames);
        }
        catch(e)
        {
            if (e instanceof KoiCommandPublicError)
            {
                this.replyWithError(interaction, e.message);
            }
            else if (e instanceof KoiCommandPrivateError)
            {
                this.replyWithVagueError(interaction, e.message);
            }
            else
            {
                console.error(e);
                this.replyWithVagueError(
                    interaction, `Unknown error occured when getting the koi`
                );
            }
            return;
        }
        if (!koiRequests)
        {
            this.replyWithVagueError(
                interaction, `Koi is undefined, which shouldn't happen`
            );
            return;
        }
        if (koiRequests.length != missingKoiNames.length)
        {
            let koiRequestNames: string[] = [];
            for (const KOI_REQUEST of koiRequests)
            {
                koiRequestNames.push(KOI_REQUEST.name);
            }
            this.replyWithVagueError(
                interaction, `Google spreadsheet had the following names: ${missingKoiNames.join(", ")}. But, the channel only had these names: ${koiRequestNames.join(", ")}.`
            )
            return;
        }

        // get list of koi we need to update in their google spreadsheet
        let updateKois: KoisProgress = {};
        for (const KOI_REQUEST of koiRequests)
        {
            // if the user does not have this koi marked as needed,
            // they must already have it
            // so mark this kois as being needed to update in their google spreadsheet
            if (KOI_REQUEST.neededBy.indexOf(interaction.user.id) < 0)
            {
                let MISSING_KOI: KoiProgress = MISSING_KOIS[KOI_REQUEST.name];
                MISSING_KOI.owned = true;
                updateKois[MISSING_KOI.name] = MISSING_KOI;
            }
        }

        await userKoiSpreadsheet.updateKoisProgress(PATTERN, updateKois);

        // we are done!            
        await interaction.editReply({ 
            content: "hi"
        });
        return;

    }
}

export default new SyncCommand();