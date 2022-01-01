import { CommandInteraction } from "discord.js";
import { RandomizeCommand } from "../structures/command/randomizeCommand";

class RollCommand extends RandomizeCommand
{
    constructor()
	{
        super("roll", "Roll a dice.");

        this.addOptionNumber(SIDES_OPTION, "Number of sides on this dice.");
	}

	public async execute(interaction: CommandInteraction): Promise<void>
    {
        const SIDES: number = this.getOptionValueNumber(interaction, SIDES_OPTION);
        const ROLLED_NUMBER: number = this.random(1, SIDES);

        await interaction.reply(`Rolling a ${SIDES} sided die...\n${ROLLED_NUMBER}`);
	}
}

const SIDES_OPTION = "sides";

export default new RollCommand();