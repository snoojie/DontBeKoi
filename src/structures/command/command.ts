import { CommandInteraction } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";

export abstract class Command 
{
    public readonly name: string;
    protected data: SlashCommandBuilder;

	constructor(name: string, description: string)
	{
        this.name = name;

        this.data = new SlashCommandBuilder()
            .setName(name)
            .setDescription(description);
        
	}

    public getSlashCommandJson(): any
    {
        return this.data.toJSON();
    }

	public abstract execute(interaction: CommandInteraction): Promise<void>;
}