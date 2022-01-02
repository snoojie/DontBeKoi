import { Collection, CommandInteraction, Message, MessageAttachment, MessageReaction, TextChannel, User } from "discord.js";
import { KoiCommand } from "../structures/command/koiCommand";
import axios, { AxiosResponse } from "axios";
import cheerio, { CheerioAPI } from "cheerio";
import * as Canvas from "canvas";

class ListCommand extends KoiCommand
{
    constructor()
	{
        super(
            "list", 
            "List everyone who need a specific koi. Ex usage: /list shigin usagi", 
            true
        );
	}

	public async execute(interaction: CommandInteraction): Promise<void>
    {
        await interaction.deferReply();

        // pattern as provided by the discord user
        const PATTERN = this.getOptionValuePattern(interaction);
        
        // color name as provided by the discord user
        const COLOR = this.getOptionValueColor(interaction);

        // check that the channel of this pattern exists
        let channel: TextChannel | undefined = await this.getChannel(interaction, PATTERN);
        if (!channel)
        {
            await this.replyWithError(
                interaction, `There isn't a channel yet for ${PATTERN}`
            );
            return;
        }

        // find our color in the pattern channel
        // note we cannot use the messages cache as it is empty
        const MESSAGES: Collection<string, Message<boolean>> = 
            (await channel.messages.fetch())
            .reverse()
            .filter(message => message.attachments.size>0);
        
        // this index is used to determine rarity
        let index = -1;

        for (let [messageId, message] of MESSAGES)
        {
            index++;

            const DRAWING: MessageAttachment | undefined = message.attachments.first();

            if (!DRAWING || 
                !DRAWING!.name || 
                !DRAWING!.name.toLowerCase().startsWith(COLOR)
            )
            {
                // this isn't the right color
                continue;
            }

            // found our color!

            // so far cache seems safe to use
            // there's no fetch anyway on ReactionManager
            // I think fetching messages also fetches the reactions anyway
            const NEED_REACTION: MessageReaction | undefined = 
                message.reactions.cache.get(this.REACTION_NEED);
            if (!NEED_REACTION)
            {
                // this shouldn't happen
                await this.replyWithError(
                    interaction, `No need reaction found on ${COLOR} ${PATTERN}.`
                );
                return;
            }

            // get everyone who needs this colored pattern
            // note we used to be able to get users from the cache,
            // but then that stopped working so now we fetch
            let people: string[] = []
            for (let [userId, user] of (await NEED_REACTION.users.fetch()))
            {
                if (!user.bot)
                {
                    people.push(`<@${userId}>`);
                }
            }

            const RARITY = index<16 ? "common" : "rare";

            // the text to display back to the user
            let replyText: string = `${RARITY} ${COLOR} ${PATTERN}`;
            if(people.length == 0)
            {
                replyText = `Nobody needs ${replyText}.`;
            }
            else
            {
                replyText = `Needing ${replyText}:\n${people.join(" ")}`;
            }

            // draw the fish

            const IMAGE_URL: string = await axios
                .create()
                .get(`https://zenkoi2.fandom.com/wiki/${PATTERN}`)
                .then(function(response: AxiosResponse<any, any>): string {
                    
                    // response.data is the html
                    const $: CheerioAPI = cheerio.load(response.data);

                    // example: Usagi common 1.jpg
                    const IMAGE_KEY = 
                        PATTERN[0].toUpperCase() + PATTERN.slice(1) + "_" + // ex: usagi -> Usagi
                        RARITY + "_" + 
                        (1+(Math.floor(index/4)%4)); // file number between [1,4]
                    
                    // return the url of this image
                    // note the url data attribute gives something like
                    // https://static.wikia.nocookie.net/zenkoi2/images/1/16/Usagi_common_1.jpg/revision/latest/scale-to-width-down/177?cb=20180514192047
                    // strip everything after .jpg
                    const URL: string = 
                        <string>$(`[data-image-key^="${IMAGE_KEY}"]`).data("src");
                    if (!URL)
                    {
                        console.error(
                            `Couldn't find the image URL for ${COLOR} ${PATTERN}`
                        );
                        return "";
                    }
                    const KEY_INDEX = URL.indexOf(IMAGE_KEY);
                    if (!KEY_INDEX)
                    {
                        console.error(
                            `Can't remove .jpg or .png from image url for ${COLOR} ${PATTERN}: ${URL}.`
                        );
                        return "";
                    }
                    return URL.substring(0, KEY_INDEX+IMAGE_KEY.length+4);
                })
                .catch(function(error): string {
                    console.error(`Failed to access wiki for ${COLOR} ${PATTERN}.`);
                    return "";
                });

            // by default, show the drawing from the pattern channel
            // this will be displayed if the wiki is missing an image for this fish
            let replyDrawing: MessageAttachment = DRAWING;
            if (IMAGE_URL)
            {
                const IMAGE: Canvas.Image = await Canvas.loadImage(IMAGE_URL);
                const KOI_WIDTH: number = IMAGE.width / 2.5;   // tested with shikoji and shiusu usagi
                const KOI_HEIGHT: number = IMAGE.height / 4;
                const CANVAS_WIDTH: number = KOI_WIDTH/2;
                const CANVAS_HEIGHT: number = KOI_HEIGHT/2;

                let canvas: Canvas.Canvas = new Canvas.Canvas(CANVAS_WIDTH, CANVAS_HEIGHT);
                let context: Canvas.NodeCanvasRenderingContext2D = canvas.getContext("2d");

                // this image has 4 colored koi
                // only draw the one we need
                const POSITION = index%4;
                context.drawImage(
                    IMAGE, 
                    0, POSITION*KOI_HEIGHT, KOI_WIDTH, KOI_HEIGHT, 
                    0, 0, KOI_WIDTH/2, KOI_HEIGHT/2
                );

                replyDrawing = new MessageAttachment(
                    canvas.toBuffer(), `${COLOR}-${PATTERN}.png`
                );
            }

            // we are done!            
            await interaction.editReply({ 
                content: replyText,
                files: [replyDrawing]
            });
            return;

        }

        // if this is reached, we could not find the color in the pattern channel
        await this.replyWithError(
            interaction, `Pattern ${PATTERN} does not have color ${COLOR}.`
        );
	}
}

export default new ListCommand();
