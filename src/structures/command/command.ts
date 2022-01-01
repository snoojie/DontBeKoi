import { CommandInteraction } from "discord.js";
import { SlashCommandBuilder, SlashCommandStringOption, SlashCommandNumberOption } from "@discordjs/builders";

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

    protected addOption(name: string, description: string): void
    {
        this.data.addStringOption(function(option: SlashCommandStringOption) {
            return option.setName(name)
                .setDescription(description)
                .setRequired(true);
        });
    }

    protected addNumberOption(name: string, description: string): void
    {
        this.data.addNumberOption(function(option: SlashCommandNumberOption) {
            return option.setName(name)
                .setDescription(description)
                .setRequired(true);
        });
    }

    protected getOption(interaction: CommandInteraction, option: string) : string
    {
        let value: string = interaction.options.getString(option) || "";
        return value.toLowerCase();
    }

    protected getNumberOption(interaction: CommandInteraction, option: string): number | undefined
    {
        return interaction.options.getNumber(option) || undefined;
    }

    protected getListOption(interaction: CommandInteraction, option: string): string[]
    {
        const LIST_STRING: string = this.getOption(interaction, option);
        return LIST_STRING.split(" ");
    }

    public getSlashCommandJson(): any
    {
        return this.data.toJSON();
    }

    protected capitalizeFirstLetter(text: string): string
    {
        if (text.length == 0)
        {
            return "";
        }
        let formattedText = text[0].toUpperCase();
        if (text.length > 1)
        {
            formattedText += text.slice(1).toLowerCase();
        }
        return formattedText;
    }

    protected async replyWithVagueError(interaction: CommandInteraction)
    {
        const REPLY = "Uh oh. Something went wrong.";

        if (interaction.deferred)
        {
            await interaction.editReply(REPLY);
        }
        else
        {
            await interaction.reply(REPLY);
        }
    }

	public abstract execute(interaction: CommandInteraction): Promise<void>;
}