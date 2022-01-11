import { CommandInteraction } from "discord.js";
import { Command } from "../structures/command/command";
import { User } from "../db/user";

const SPREADSHEET_OPTION: string = "spreadsheet";

class GoogleCommand extends Command
{
    constructor()
	{
        super("google", "Register your google spreadsheet.");
        this.addOption(SPREADSHEET_OPTION, "ID of your google spreadsheet.");
    }

	public async execute(interaction: CommandInteraction): Promise<void>
    {
        await interaction.deferReply({ ephemeral: true });

        const SPREADSHEET_ID: string = this.getOptionValue(interaction, SPREADSHEET_OPTION);

        const USER: User | undefined = 
            await User.setSpreadsheet(interaction.user.id, SPREADSHEET_ID);
        if (!USER)
        {
            await interaction.editReply(`Someone else has spreadsheet ${SPREADSHEET_ID} already.`);
            return;
        }

        await interaction.editReply(`Updated your spreadsheet to ${SPREADSHEET_ID}`);
	}
}

export default new GoogleCommand();