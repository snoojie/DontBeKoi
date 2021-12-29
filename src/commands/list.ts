import { Collection, CommandInteraction, GuildBasedChannel, Message, MessageAttachment, MessageManager, MessageReaction, ReactionUserManager, TextChannel, User } from "discord.js";
import { KoiCommand } from "../structures/command/koiCommand";
import { PatternCollection, KoiColoring } from "../patternUtil";
import * as Canvas from "canvas";

class ListCommand extends KoiCommand
{
    constructor()
	{
        super("list", "List players who need a specific koi.", true);
	}

	public async execute(interaction: CommandInteraction): Promise<void>
    {
        await interaction.deferReply();

        if (!this.validateInteraction(interaction))
        {
            return;
        }

        // pattern as provided by the discord user
        const PATTERN = this.getPattern(interaction);
        
        // color name as provided by the discord user
        const COLOR = this.getColor(interaction);

        // check that the channel of this pattern exists
        let channel: TextChannel | undefined = 
            this.getChannelOfPattern(interaction, PATTERN);
        if (!channel)
        {
            console.error(`User requested to list everyone who needs ${PATTERN} but its channel does not exist`);
            interaction.editReply(`There isn't a channel yet for ${PATTERN}.`);
            return;
        }

        let usernames: string[] = [];

        // find our color in the pattern channel
        let messages: Collection<string, Message<boolean>> = await channel.messages.fetch();
        for (let [messageId, message] of messages)
        {
            let attachment: MessageAttachment | undefined = message.attachments.first();
            if (attachment && 
                attachment.name && 
                attachment.name.toLowerCase().startsWith(COLOR))
            {
                // found our pattern!
                //console.log(message);
                let reaction: MessageReaction | undefined = 
                    message.reactions.cache.get(this.REACTION_NEED);
                if (!reaction)
                {
                    console.error(`No reactions found`);
                    this.replyWithVagueError(interaction);
                    return;
                }
                let users: Collection<string, User> = await reaction.users.fetch();
                
                for (let [userid, user] of users)
                {
                    if (!user.bot)
                    {
                        usernames.push(user.username);
                    }
                }

                // we're done!
                if (usernames.length == 0)
                {
                    await interaction.editReply(`Nobody needs ${COLOR} ${PATTERN}.`);
                    return;
                }
                await interaction.editReply(`Folks needing ${COLOR} ${PATTERN}:\n${usernames.join("\n")}`);
                return;
            }
        }

        // if this is reached, we could not find the color in the pattern channel
	    await interaction.editReply(`Pattern ${PATTERN} does not have color ${COLOR}.`);
	}
}

export default new ListCommand();