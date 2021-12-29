import { Command } from "./command";
import { SlashCommandStringOption } from "@discordjs/builders";
import { CommandInteraction, GuildBasedChannel, TextChannel } from "discord.js";
import { PatternUtil, PatternCollection } from "../../patternUtil";

export abstract class KoiCommand extends Command
{
    protected REACTION_NEED = "🎣";
    protected REACTION_DRAGON = "🐉";

    constructor(name: string, description: string, colorOption: boolean = false)
    {
        super(name, description);
        
        if (colorOption)
        {
            this.addOption(COLOR, "Color of the koi.");
        }
        this.addOption(PATTERN, "Name of the koi pattern.");
    }

    protected addOption(name: string, description: string): void
    {
        this.data.addStringOption(function(option) {
            return option.setName(name)
                .setDescription(description)
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
        return this.getOption(interaction, PATTERN);
    }
    
    protected getColor(interaction: CommandInteraction) : string
    {
        return this.getOption(interaction, COLOR);
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

    protected async getPatternCollection(pattern: string) : Promise<PatternCollection>
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
}

const PATTERN = "pattern";
const COLOR = "color";