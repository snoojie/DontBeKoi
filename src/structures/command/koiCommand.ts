import { Command } from "./command";
import { Collection, CommandInteraction, GuildBasedChannel, Message, MessageAttachment, MessageReaction, TextChannel } from "discord.js";

const OPTION_PATTERN_NAME = "pattern";
const OPTION_COLOR_NAME = "color";

export enum Rarity
{
    Common = "common",
    Rare = "rare"
}

export interface Koi
{
    name: string;
    neededBy: string[];
    rarity: Rarity;
    index: number;
    drawing: MessageAttachment;
}

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

    protected async getKoi(
        interaction: CommandInteraction, patternName: string, colorName: string
    ): Promise<Koi>
    {
        const KOIS: Koi[] = await this._getKois(interaction, patternName, colorName);
        if (KOIS.length==0)
        {
            throw new KoiCommandPublicError(
                `Pattern ${patternName} does not have color ${colorName}`
            );
        }
        return KOIS[0];
    }

    protected async getKois(
        interaction: CommandInteraction, patternName: string
    ): Promise<Koi[]>
    {
        return this._getKois(interaction, patternName);
    }

    private async _getKois(
        interaction: CommandInteraction, patternName: string, colorName?: string
    ): Promise<Koi[]>
    {
        let kois: Koi[] = [];

        // check that the channel of this pattern exists
        let channel: TextChannel | undefined = await this.getChannel(interaction, patternName);
        if (!channel)
        {
            throw new KoiCommandPublicError(
                `There is no channel for pattern ${patternName}.`
            );
        }

        // get all messages representing a single koi
        // ie, ignore the text messages referencing rarity or line breaks
        // note we cannot use the messages cache as it is empty
        const MESSAGES: Collection<string, Message<boolean>> = 
            (await channel.messages.fetch())
            .reverse()
            .filter(message => message.attachments.size>0);

        let rarityIndex = -1;
        let users = [];
        for (const [MESSAGEID, MESSAGE] of MESSAGES)
        {
            rarityIndex++;

            const DRAWING: MessageAttachment | undefined = MESSAGE.attachments.first();
            if (!DRAWING || !DRAWING.name)
            {
                throw new KoiCommandPrivateError(
                    `Couldn't find attachment or attachment had no name`
                );
            }

            const NAME: string = DRAWING.name.slice(0,-4);

            if (colorName && colorName != NAME.toLowerCase())
            {
                // we are looking for a specific color, 
                // and this koi isn't it
                continue;
            }

            // so far cache seems safe to use
            // there's no fetch anyway on ReactionManager
            // I think fetching messages also fetches the reactions anyway
            const NEED_REACTION: MessageReaction | undefined = 
                MESSAGE.reactions.cache.get(this.REACTION_NEED);
            if (!NEED_REACTION)
            {
                // this shouldn't happen
                throw new KoiCommandPrivateError(
                    `No need reaction found on ${DRAWING.name}.`
                );
            }

            // get everyone who needs this koi
            // note we used to be able to get users from the cache,
            // but then that stopped working so now we fetch
            let neededBy: string[] = []
            for (let [userId, user] of (await NEED_REACTION.users.fetch()))
            {
                if (!user.bot)
                {
                    neededBy.push(userId);
                }
            }

            kois.push({
                name: NAME,
                neededBy: neededBy,
                rarity: rarityIndex<16 ? Rarity.Common : Rarity.Rare,
                index: rarityIndex,
                drawing: DRAWING
            });

            if (colorName && colorName == NAME.toLowerCase())
            {
                // this is our color! we are done
                break;
            }
        }

        return kois;
    }
}

export class KoiCommandPublicError extends Error {}
export class KoiCommandPrivateError extends Error {}