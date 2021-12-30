import { CommandInteraction } from "discord.js";
import { RandomizeCommand } from "../structures/command/randomizeCommand";

class RollCommand extends RandomizeCommand
{
    constructor()
	{
        super("roll", "Roll a dice.");

        this.addNumberOption(SIDES_OPTION, "Number of sides on this dice.");
	}

	public async execute(interaction: CommandInteraction): Promise<void>
    {
        const SIDES: number | undefined = this.getNumberOption(interaction, SIDES_OPTION);
        if (!SIDES)
        {
            // this shouldn't be reached since the sides option is required
            console.error("The number of sides is undefined");
            this.replyWithVagueError(interaction);
            return;
        }
        const ROLLED_NUMBER: number = this.random(1, SIDES);

        await interaction.reply(`Rolling a ${SIDES} sided die...\n${ROLLED_NUMBER}`);
	}
}

const SIDES_OPTION = "sides";

export default new RollCommand();