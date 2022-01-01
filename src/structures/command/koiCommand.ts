import { Command } from "./command";
import { CommandInteraction, GuildBasedChannel, TextChannel } from "discord.js";

export abstract class KoiCommand extends Command
{
    protected readonly REACTION_NEED = "🎣";
    protected readonly REACTION_DRAGON = "🐉";

    constructor(name: string, description: string, colorOption: boolean = false)
    {
        super(name, description);
        
        if (colorOption)
        {
            this.addOption(COLOR, "Color of the koi.");
        }
        this.addOption(PATTERN, "Name of the koi pattern.");
    }
    
    // confirmed both
    protected getOptionValuePattern(interaction: CommandInteraction) : string
    {
        return this.getOptionValue(interaction, PATTERN);
    }
    
    protected getColor(interaction: CommandInteraction) : string
    {
        return this.getOptionValue(interaction, COLOR);
    }
}

const PATTERN = "pattern";
const COLOR = "color";