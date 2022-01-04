import { CommandInteraction, GuildBasedChannel, TextChannel } from "discord.js";
import { SlashCommandBuilder, SlashCommandStringOption, SlashCommandNumberOption } 
    from "@discordjs/builders";

export abstract class Command 
{
    /**
     * Name of this slash command. ex:
     * 
     * /roll sides: 6
     * 
     * The name is "roll".
     */
    public readonly NAME: string;

    protected data: SlashCommandBuilder;

	constructor(name: string, description: string)
	{
        this.NAME = name;

        this.data = new SlashCommandBuilder()
            .setName(name)
            .setDescription(description);
	}

    //==========================
    //=====abstract methods=====
    //==========================

    /**
     * Execute this slash command.
     * 
     * @param interaction Interaction this slash command occured in.
     */
    public abstract execute(interaction: CommandInteraction): Promise<void>;

    //=================================
    //=====SLASH COMMAND HANDLING=====
    //================================

    /**
     * @returns Slash command in JSON format
     */
    public getSlashCommandJson(): any
    {
        // we return any instead of RESTPostAPIApplicationCommandsJSONBody
        // because importing that type doesn't seem to work for some reason
        return this.data.toJSON();
    }

    // =========================
    // =====OPTION HANDLING=====
    // =========================

    /**
     * Adds a string option to this slash command. ex:
     * 
     * /collector pattern:bukimi
     * 
     * "pattern" is the option name. 
     * When the user types "pattern", they will see its description.
     * 
     * Since this is a string option, the value provided, 
     * "bukimi" in this example, must be a string.
     * 
     * @param name Name that is displayed to the discord user in the slash command.
     * @param description Describes the option and is displayed to the discord user 
     *                    in the slash command.
     */
    protected addOption(name: string, description: string): void
    {
        this.data.addStringOption(
            function(option: SlashCommandStringOption): SlashCommandStringOption 
            {
                return option.setName(name)
                    .setDescription(description)
                    .setRequired(true);
            }
        );
    }

    /**
     * Adds a number option to this slash command. ex:
     * 
     * /roll sides:6
     * 
     * "roll" is the option name. 
     * When the user types "sides", they will see its description.
     * 
     * Since this is a number option, the value provided, 
     * 3 in this example, must be a number.
     * 
     * @param name Name that is displayed to the discord user in the slash command.
     * @param description Describes the option and is displayed to the discord user 
     *                    in the slash command.
     */
    protected addOptionNumber(name: string, description: string): void
    {
        this.data.addNumberOption(
            function(option: SlashCommandNumberOption): SlashCommandNumberOption 
            {
                return option.setName(name)
                    .setDescription(description)
                    .setRequired(true);
            }
        );
    }

    /**
     * Gets the lower case string value the discord user entered for this option.
     * 
     * /collector pattern:Bukimi
     * 
     * "pattern" is the option name. The return value is "bukimi".
     * 
     * @param interaction Interaction this slash command occured in.
     * @param option Name of the option.
     * @returns Value of the option as provided by the discord user.
     */
    protected getOptionValue(interaction: CommandInteraction, option: string): string
    {
        return (interaction.options.getString(option) || "").toLowerCase();
    }

    /**
     * Gets the number value the discord user entered for this option.
     * 
     * /roll sides:6
     * 
     * "sides" is the option name. The return value is 6.
     * 
     * @param interaction Interaction this slash command occured in.
     * @param option Name of the option.
     * @returns Value of the option as provided by the discord user.
     */
    protected getOptionValueNumber(interaction: CommandInteraction, option: string): number
    {
        const VALUE: number | null = interaction.options.getNumber(option);
        if (VALUE == null)
        {
            // this should never happen because the option is required
            throw `Option ${option} is required but could not get its number value.`;
        }
        return VALUE;
    }

    /**
     * Gets the lower case string array value the discord user entered for this option.
     * 
     * /eenie choices:Snooj Blind Whyte
     * 
     * "choices" is the option name. The return value is ["snooj", "blind", "whyte"].
     * 
     * @param interaction Interaction this slash command occured in.
     * @param option Name of the option.
     * @returns Value of the option as provided by the discord user.
     */
    protected getOptionValueList(interaction: CommandInteraction, option: string): string[]
    {
        return this.getOptionValue(interaction, option).split(" ");
    }

    //==============================================
    //=====Handling errors in command exeuction=====
    //==============================================

    /**
     * Handle errors in the slash command by 
     * printing the error in the console and discord.
     * 
     * @param interaction Interaction this slash command occured in.
     * @param errorMessage Message to print in the console logs and discord.
     */
     protected async replyWithError(
        interaction: CommandInteraction, errorMessage: string
    ): Promise<void>
    {
        await this._replyWithError(interaction, errorMessage, false);
    }

    /**
     * Handle errors in the slash command by 
     * printing the error in the console and sending a vague error message to discord.
     * 
     * @param interaction Interaction this slash command occured in.
     * @param errorMessage Message to print in the console logs.
     */
    protected async replyWithVagueError(
        interaction: CommandInteraction, errorMessage: string
    ): Promise<void>
    {
        await this._replyWithError(interaction, errorMessage, true);
    }

    /**
     * Handle errors in the slash command by 
     * printing the error in the console and 
     * sending either that error or a vague error message to discord.
     * 
     * @param interaction Interaction this slash command occured in.
     * @param errorMessage Message to print in the console logs.
     * @param isVague If true, the error message will also be sent in discord. 
     *                Otherwise, a generic "Uh oh" message will be sent.
     */
    protected async _replyWithError(
        interaction: CommandInteraction, errorMessage: string, isVague: boolean
    ): Promise<void>
    {
        console.error(errorMessage);
        
        const PUBLIC_MESSAGE: string = 
            isVague ? "Uh oh, something went wrong." : errorMessage;

        if (interaction.deferred)
        {
            await interaction.editReply(PUBLIC_MESSAGE);
        }
        else
        {
            await interaction.reply(PUBLIC_MESSAGE);
        }
    }

    //============================================
    //=====Helper functions for child classes=====
    //============================================

    /** 
     * @param interaction Interaction this slash command occured in.
     * @param name Name of the channel.
     * @returns The channel if it exists, otherwise undefined.
     */
    protected async getChannel(interaction: CommandInteraction, name: string) : Promise<TextChannel | undefined>
    {
        if (!interaction.guild)
        {
            return;
        }

        // although cache seems to work,
        // lets fetch just to be safe
        const CHANNEL: GuildBasedChannel | undefined = 
            (await interaction.guild.channels.fetch())
            .find(channel => channel.name.startsWith(name));
        if (!CHANNEL || !CHANNEL.isText())
        {
            return;
        }
        
        return <TextChannel>CHANNEL;
    }

	
}