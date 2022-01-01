import { Command } from "./command";
import { CommandInteraction, GuildBasedChannel, TextChannel } from "discord.js";

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
    
    protected getPatternOption(interaction: CommandInteraction) : string
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
}

const PATTERN = "pattern";
const COLOR = "color";