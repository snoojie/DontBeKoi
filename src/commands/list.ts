import { Collection, CommandInteraction, GuildBasedChannel, Message, MessageAttachment, MessageEmbed, MessageManager, MessageReaction, ReactionUserManager, TextChannel, User } from "discord.js";
import { KoiCommand } from "../structures/command/koiCommand";
import { PatternCollection, KoiColoring } from "../patternUtil";
import axios from "axios";
import cheerio, { Cheerio, CheerioAPI } from "cheerio";
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

        // find our color in the pattern channel
        const MESSAGES: Collection<string, Message<boolean>> = await channel.messages.fetch();
        let colorIndex = 32;
        for (let [messageId, message] of MESSAGES)
        {
            const COLOR_IMAGE: MessageAttachment | undefined = message.attachments.first();
            if (!COLOR_IMAGE)
            {
                // this is likely the message starting commons or rares
                // or a line break
                continue;
            }
            colorIndex--;

            if (!COLOR_IMAGE.name || !COLOR_IMAGE.name.toLowerCase().startsWith(COLOR))
            {

                // this isn't the right color
                continue;
            }

            // found our color!
            const NEED: MessageReaction | undefined = 
                message.reactions.cache.get(this.REACTION_NEED);
            if (!NEED)
            {
                console.error(`No need reaction found on ${COLOR} ${PATTERN}.`);
                await this.replyWithVagueError(interaction);
                return;
            }

            // get everyone who needs this colored pattern            
            const USERS: Collection<string, User> = await NEED.users.fetch();
            let usernames: string[] = [];
            for (let [userId, user] of USERS)
            {
                if (!user.bot)
                {
                    usernames.push(user.username);
                }
            }

            const RARITY = colorIndex<16 ? "common" : "rare";

            const IMAGE_URL: string = await axios
                .create()
                .get(`https://zenkoi2.fandom.com/wiki/${PATTERN}`)
                .then(function(response) {
                    
                    // response.data is the html
                    const $: CheerioAPI = cheerio.load(response.data);

                    // example: Usagi common 1.jpg
                    const IMAGE_KEY = 
                        PATTERN[0].toUpperCase() + PATTERN.slice(1) + "_" + // ex: usagi -> Usagi
                        RARITY + "_" + 
                        (1+(Math.floor(colorIndex/4)%4));                   // file number
                    
                    // return the url of this image
                    // note the url data attribute gives something like
                    // https://static.wikia.nocookie.net/zenkoi2/images/1/16/Usagi_common_1.jpg/revision/latest/scale-to-width-down/177?cb=20180514192047
                    // strip everything after .jpg
                    const URL: string = <string>$(`[data-image-key^="${IMAGE_KEY}"]`).data("src");
                    if (!URL)
                    {
                        console.error(`Couldn't find the image URL for ${COLOR} ${PATTERN}`);
                        return "";
                    }
                    const KEY_INDEX = URL.indexOf(IMAGE_KEY);
                    if (!KEY_INDEX)
                    {
                        console.error(`Can't remove .jpg or .png from image url for ${COLOR} ${PATTERN}: ${URL}.`);
                        return "";
                    }
                    return URL.substring(0, KEY_INDEX+IMAGE_KEY.length+4);
                })
                .catch(function(error) {
                    console.error(`Failed to access wiki for ${COLOR} ${PATTERN}.`);
                    return "";
                });
            if (!IMAGE_URL)
            {
                console.error(`Image url for ${COLOR} ${PATTERN} is empty.`);
                await this.replyWithVagueError(interaction);
                return;
            }

            // draw the fish

            const IMAGE = await Canvas.loadImage(IMAGE_URL);
            const KOI_WIDTH = IMAGE.width / 2.5;
            const KOI_HEIGHT = IMAGE.height / 4;
            const CANVAS_WIDTH = KOI_WIDTH/2;
            const CANVAS_HEIGHT = KOI_HEIGHT/2;

            let canvas: Canvas.Canvas = new Canvas.Canvas(CANVAS_WIDTH, CANVAS_HEIGHT);
            let context: Canvas.NodeCanvasRenderingContext2D = canvas.getContext("2d");

            // this image has 4 colored koi
            // only draw the one we need
            const POSITION = colorIndex%4;
            context.drawImage(
                IMAGE, 
                0, POSITION*KOI_HEIGHT, KOI_WIDTH, KOI_HEIGHT, 
                0, 0, KOI_WIDTH/2, KOI_HEIGHT/2
            );

            let replyText: string = `${RARITY} ${COLOR} ${PATTERN}`;
            if(usernames.length == 0)
            {
                replyText = `Nobody needs ${replyText}.`;
            }
            else
            {
                replyText = `Needing ${replyText}:\n${usernames.join("\n")}`;
            }

            // we are done!            
            await interaction.editReply({ 
                content: replyText,
                files: [new MessageAttachment(
                    canvas.toBuffer(), `${COLOR}-${PATTERN}.png`
                )]
            });
            return;

        }

        // if this is reached, we could not find the color in the pattern channel
	    await interaction.editReply(`Pattern ${PATTERN} does not have color ${COLOR}.`);
	}
}

export default new ListCommand();
