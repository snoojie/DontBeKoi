import { CommandInteraction } from "discord.js";
import { RandomizeCommand } from "../structures/command/randomizeCommand";

class EenieCommand extends RandomizeCommand
{
    constructor()
	{
        super("eenie", `${EENIE_PHRASE}.`);

        this.addOption(OPTION, "List of what to pick from.");
	}

	public async execute(interaction: CommandInteraction): Promise<void>
    {
        const CHOICES: string[] = this.getListOption(interaction, OPTION);
        const INDEX = this.random(0, CHOICES.length-1);
        const CHOICE = CHOICES[INDEX];
        
        await interaction.reply(`${CHOICES.join(" or ")} ... ${EENIE_PHRASE} ...\n${CHOICE.toUpperCase()}`);
	}
}

const OPTION = "choices";

const EENIE_PHRASE = "Eenie meenie miney mo";

export default new EenieCommand();