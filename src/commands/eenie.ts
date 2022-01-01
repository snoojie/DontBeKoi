import { CommandInteraction } from "discord.js";
import { RandomizeCommand } from "../structures/command/randomizeCommand";

const OPTION_NAME: string = "choices";
const EENIE_PHRASE: string = "Eenie meenie miney mo";

class EenieCommand extends RandomizeCommand
{
    constructor()
	{
        super("eenie", `${EENIE_PHRASE}.`);

        this.addOption(OPTION_NAME, "List of what to randomly pick from.");
	}

	public async execute(interaction: CommandInteraction): Promise<void>
    {
        const CHOICES: string[] = this.getOptionValueList(interaction, OPTION_NAME);
        const CHOICE: string = CHOICES[this.random(0, CHOICES.length-1)];
        
        await interaction.reply(
            `${CHOICES.join(" or ")} ... ${EENIE_PHRASE} ...\n${CHOICE.toUpperCase()}`
        );
	}
}

export default new EenieCommand();