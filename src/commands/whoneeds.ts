import { CommandInteraction } from "discord.js";
import { KoiCommand } from "../structures/command/koiCommand";

class WhoNeedsCommand extends KoiCommand
{
    constructor()
	{
        super("whoneeds", "TODO");
	}

	public async execute(interaction: CommandInteraction): Promise<void>
    {
        interaction.reply("Pong!");
	}
}

export default new WhoNeedsCommand();