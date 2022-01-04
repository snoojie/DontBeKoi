import { Collection, CommandInteraction, Message, MessageAttachment, MessageReaction, ReactionUserManager, TextChannel, User } from "discord.js";
import { Koi, KoiCommand, KoiCommandPrivateError, KoiCommandPublicError } from "../structures/command/koiCommand";
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

    public async dostuff(interaction: CommandInteraction) {
        let cacheChannel = <TextChannel>interaction!.guild!.channels.cache.get("925593521224826890"); 
        if(cacheChannel){
            return cacheChannel!.messages!.fetch("925593747188748318").then(reactionMessage => {
                return reactionMessage.reactions.resolve(this.REACTION_NEED)!.users.fetch().then(userList => {
                    return userList.map((user) => user.id)
                });
            });
        }
        return;
    }

	public async execute(interaction: CommandInteraction): Promise<void>
    {
        await interaction.deferReply();

        // pattern as provided by the discord user
        const PATTERN = this.getOptionValuePattern(interaction);
        
        // color name as provided by the discord user
        const COLOR = this.getOptionValueColor(interaction);

        // get this koi from the channel
        let koi: Koi | undefined = undefined;
        try
        {
            koi = await this.getKoi(interaction, PATTERN, COLOR);
        }
        catch(e)
        {
            if (e instanceof KoiCommandPublicError)
            {
                this.replyWithError(interaction, e.message);
            }
            else if (e instanceof KoiCommandPrivateError)
            {
                this.replyWithVagueError(interaction, e.message);
            }
            else
            {
                console.error(e);
                this.replyWithVagueError(
                    interaction, `Unknown error occured when getting the koi`
                );
            }
            return;
        }
        if (!koi)
        {
            this.replyWithVagueError(
                interaction, `Koi is undefined, which shouldn't happen`
            );
            return;
        }

        // the text to display back to the user
        let replyText: string = `${koi.rarity} ${COLOR} ${PATTERN}`;
        if(koi.neededBy.length == 0)
        {
            replyText = `Nobody needs ${replyText}.`;
        }
        else
        {
            const MENTIONS: string[] = koi.neededBy.map(userId => `<@${userId}>`);
            replyText = `Needing ${replyText}:\n${MENTIONS.join(" ")}`;
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
                    koi!.rarity + "_" + 
                    (1+(Math.floor(koi!.index/4)%4)); // file number between [1,4]
                console.log(IMAGE_KEY);
                
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
        let replyDrawing: MessageAttachment = koi.drawing;
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
            const POSITION = koi.index%4;
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
}

export default new ListCommand();

class KoiError extends Error
{

}