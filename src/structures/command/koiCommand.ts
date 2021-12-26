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
    
    protected getPattern(interaction: CommandInteraction) : string
    {
        
        let pattern = interaction.options.getString(PATTERN);
        if (!pattern)
        {
            return "";
        }
        return pattern.toLowerCase();
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
}

const PATTERN = "pattern";