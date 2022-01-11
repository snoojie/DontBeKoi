import { CommandInteraction, Message, MessageAttachment, TextChannel } from "discord.js";
import { KoiCommand } from "../structures/command/koiCommand";
import * as Canvas from "canvas";
import { Pattern } from "../db/pattern";
import { Color } from "../koiInterfaces";

class CollectorCommand extends KoiCommand
{
    constructor()
	{
        super("collector", "Create collector channel.");
	}

	public async execute(interaction: CommandInteraction): Promise<void>
    {
        await interaction.deferReply();

        if (!interaction.guild)
        {
            // this shouldn't ever happen
            await this.replyWithVagueError(
                interaction, "This interaction is not associated with a guild."
            );
            return;
        }

        // pattern as provided by the discord user
        const PATTERN_NAME = this.getOptionValuePattern(interaction);

        // confirm that there doesn't yet exist a channel for this pattern
        let channel: TextChannel | undefined = await this.getChannel(interaction, PATTERN_NAME);
        if (channel)
        {
            await this.replyWithError(
                interaction, `There already exists a channel for ${PATTERN_NAME}`
            );
            return;
        }

        // get the pattern
        const PATTERN: Pattern | undefined = await Pattern.getCollector(PATTERN_NAME);
        if (!PATTERN)
        {
            await this.replyWithError(
                interaction, `Pattern ${PATTERN_NAME} is not a valid collector pattern.`
            );
            return;
        }
        
        // create channel for this pattern
        // note interaction.guild was proven valid in the validateInteraction method earlier
        channel = <TextChannel>await interaction.guild.channels.create(
            PATTERN_NAME + " - " + PATTERN.hatchTime, 
            { 
                parent: process.env.CATEGORY_ID
            }
        );

        // populate the new channel
        await this.sendCollection(
            channel, PATTERN.baseColors, PATTERN.commonColors, "COMMONS"
        );
        await channel.send("=====");
        await this.sendCollection(
            channel, PATTERN.baseColors, PATTERN.rareColors, "RARES"
        );

        // edit our earlier deferred response
        // we are done!
	    await interaction.editReply(`Created the ${PATTERN_NAME} channel!`);
	}

    /**
     * Populate the channel with the pattern collection.
     * This is either the common collection or rare collection.
     * 
     * @param channel The channel to send the collection to.
     * @param baseColors The base colors of the collection.
     * @param highlightColors The highlight colors of the collection.
     * @param rarity The rarity of the collection. 
     *               This gets printed in the channel as a title 
     *               before the collection is sent.
     */
    private async sendCollection(
        channel: TextChannel,
        baseColors: Color[], 
        highlightColors: Color[], 
        rarity: string
    ): Promise<void>
    {
        const CANVAS_HEIGHT: number = 30;

        await channel.send("**" + rarity + ":**");
        for (let baseColor of baseColors)
        {
            for (let highlightColor of highlightColors)
            {
                const KOI_NAME: string = baseColor.name + highlightColor.name

                // draw 
    
                let canvas: Canvas.Canvas = Canvas.createCanvas(250, CANVAS_HEIGHT);
                let context: Canvas.NodeCanvasRenderingContext2D = canvas.getContext("2d");
                
                // base color
                this.drawCircle(context, CANVAS_HEIGHT / 2, baseColor.hex);
        
                // highlight color
                this.drawCircle(context, CANVAS_HEIGHT * 0.22, highlightColor.hex);
        
                // name as text 
                context.fillStyle="white";
                context.font = "20px Papyrus";
                context.fillText(KOI_NAME, CANVAS_HEIGHT + 10, CANVAS_HEIGHT * 0.7 );

                // generate message with the drawing
                let message: Message = await channel.send({ 
                    files: [new MessageAttachment(canvas.toBuffer(), KOI_NAME + ".png")]
                });

                // add emojis to the message
                await message.react(this.REACTION_NEED);
                await message.react(this.REACTION_DRAGON);
            }
        }
    }

    /**
     * Draw a circle on a canvas.
     * 
     * @param context The canvas context to draw on.
     * @param radius Radius of the circle.
     * @param hexColor Color of the circle.
     */
    private drawCircle(
        context: Canvas.NodeCanvasRenderingContext2D, radius: number, hexColor: string
    ): void
    {
        // the circle's center (x, y) is half the canvas height
        const CIRCLE_CENTER = context.canvas.height / 2;
    
        // drawing a circle requires the start and end angles for the arc function
        const CIRCLE_START_ANGLE = 0;
        const CIRCLE_END_ANGLE = 2 * Math.PI;
    
        context.beginPath();
        context.arc(CIRCLE_CENTER, CIRCLE_CENTER, radius, CIRCLE_START_ANGLE, CIRCLE_END_ANGLE);
        context.fillStyle = hexColor;
        context.fill();
    }
}

export default new CollectorCommand();