import { Command } from "./command";
import { SlashCommandStringOption } from "@discordjs/builders";
import { CommandInteraction, GuildBasedChannel, TextChannel } from "discord.js";
import { PatternUtil, PatternCollection } from "../../patternUtil";

export abstract class KoiCommand extends Command
{
    constructor(name: string, description: string)
    {
        super(name, description);
        
        this.data.addStringOption(function(option:  SlashCommandStringOption) {
            return option.setName(PATTERN)
                .setDescription("Name of the koi pattern")
                .setRequired(true);
        });
    }

    protected getOption(interaction: CommandInteraction, option: string) : string
    {
        let value = interaction.options.getString(option);
        if (!value)
        {
            return "";
        }
        return value.toLowerCase();
    }
    
    protected getPattern(interaction: CommandInteraction) : string
    {
        return this.getOption(interaction, PATTERN).toLowerCase();
    }

    protected getChannelOfPattern(interaction: CommandInteraction, pattern: string) : TextChannel | undefined
    {
        if (!interaction.guild)
        {
            console.error("This interaction was not in a guild, which doesn't make sense");
            return undefined;
        }

        const CHANNEL: GuildBasedChannel | undefined = 
            interaction.guild.channels.cache.find(
                CHANNEL => CHANNEL.name.startsWith(pattern)
            );
        if (!CHANNEL || !CHANNEL.isText())
        {
            return;
        }
        
        return <TextChannel>CHANNEL;
    }

    protected async getPatternCollection(pattern: string) : Promise<PatternCollection | undefined>
    {
        return PatternUtil.getCollection(pattern);
    }

    protected validateInteraction(interaction: CommandInteraction): boolean
    {
        if (!interaction.guild)
        {
            console.error("This interaction is not associated with a guild.");
            this.replyWithVagueError(interaction);
            return false;
        }
        return true;
    }

    protected replyWithVagueError(interaction: CommandInteraction)
    {
        const REPLY = "Uh oh. Something went wrong.";

        if (interaction.deferred)
        {
            interaction.editReply(REPLY);
        }
        else
        {
            interaction.reply(REPLY);
        }
    }
}

const PATTERN = "pattern";