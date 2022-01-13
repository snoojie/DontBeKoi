import { CommandInteraction } from "discord.js";
import { Koi, Pattern } from "../db/pattern";
import { User } from "../db/user";
import { KoiCommand } from "../structures/command/koiCommand";

class WhoCommand extends KoiCommand
{
    constructor()
	{
        super(
            "who", 
            "List everyone who need a specific koi. Ex usage: /who shigin usagi", 
            true
        );
    }

	public async execute(interaction: CommandInteraction): Promise<void>
    {
        await interaction.deferReply();

        // pattern as provided by the discord user
        const PATTERN: string = this.getOptionValuePattern(interaction);
        
        // color name as provided by the discord user
        const COLOR: string = this.getOptionValueColor(interaction);

        // get info on this koi like its rarity
        let koi: Koi;
        try {
            koi = await Pattern.getKoi(PATTERN, COLOR);
        }
        catch (error)
        {
            console.log("No koi");
            await this._handleError(interaction, error);
            return;
        }

        // find all users missing this koi
        let neededBy: User[] = [];
        try {
            neededBy = await User.whoIsMissingKoi(PATTERN, COLOR);
        }
        catch (error)
        {
            console.log("No needed by");
            await this._handleError(interaction, error);
            return;
        }

        let replyText: string = `${koi.rarity} ${COLOR} ${PATTERN}`;
        if(neededBy.length == 0)
        {
            replyText = `Nobody needs ${replyText}.`;
        }
        else
        {
            const MENTIONS: string[] = neededBy.map(user => `<@${user.discordId}>`);
            replyText = `Needing ${replyText}:\n${MENTIONS.join(" ")}`;
        }

        await interaction.editReply(replyText);
	}

    private async _handleError(interaction: CommandInteraction, error: any): Promise<void>
    {
        if (error.message)
        {
            await this.replyWithError(interaction, error.message)
            return;
        }
        await this.replyWithVagueError(interaction, error);
        return;
    }
}

export default new WhoCommand();