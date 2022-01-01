import { CommandInteraction } from "discord.js";
import { RandomizeCommand } from "../structures/command/randomizeCommand";

const OPTION_NAME: string= "sides";

class RollCommand extends RandomizeCommand
{
    constructor()
	{
        super("roll", "Roll a dice.");

        this.addOptionNumber(OPTION_NAME, "Number of sides on this dice.");
	}

	public async execute(interaction: CommandInteraction): Promise<void>
    {
        // roll [1, number of sides on dice] inclusive
        const SIDES = this.getOptionValueNumber(interaction, OPTION_NAME);

        if (SIDES < 2)
        {
            await this.replyWithError(interaction, "Dice needs at least 2 sides.");
            return;
        }

        const ROLLED_NUMBER: number = this.random(1, SIDES);

        await interaction.reply(`Rolling a ${SIDES} sided die...\n${ROLLED_NUMBER}`);
	}
}

export default new RollCommand();