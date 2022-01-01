import { Command } from "./command";
import { CommandInteraction, GuildBasedChannel, TextChannel } from "discord.js";

const OPTION_PATTERN_NAME = "pattern";
const OPTION_COLOR_NAME = "color";

export abstract class KoiCommand extends Command
{
    protected readonly REACTION_NEED = "🎣";
    protected readonly REACTION_DRAGON = "🐉";

    constructor(name: string, description: string, colorOption: boolean = false)
    {
        super(name, description);
        
        if (colorOption)
        {
            this.addOption(OPTION_COLOR_NAME, "Koi color name, for example shigin.");
        }
        this.addOption(OPTION_PATTERN_NAME, "Koi pattern, for example usagi.");
    }
    
    /**
     * Gets the pattern the discord user entered for the pattern option.
     * 
     * /collector pattern:bukimi
     * 
     * Returns "bukimi"
     * 
     * @param interaction Interaction this slash command occured in.
     * @returns Pattern as provided by the discord user.
     */
    protected getOptionValuePattern(interaction: CommandInteraction): string
    {
        return this.getOptionValue(interaction, OPTION_PATTERN_NAME);
    }
    
    /**
     * Gets the color the discord user entered for the color option.
     * 
     * /list color:shigin pattern:usagi
     * 
     * Returns "shigin"
     * 
     * @param interaction Interaction this slash command occured in.
     * @returns Color as provided by the discord user.
     */
    protected getOptionValueColor(interaction: CommandInteraction): string
    {
        return this.getOptionValue(interaction, OPTION_COLOR_NAME);
    }
}