import { CommandInteraction, GuildBasedChannel, Message, MessageAttachment, TextChannel } from "discord.js";
import { KoiCommand } from "../structures/command/koiCommand";
import * as Canvas from "canvas";
import { Color, Pattern } from "../db/db";

class CollectorCommand extends KoiCommand
{
    constructor()
	{
        super("collector", "Create collector channel.");
	}

	public async execute(interaction: CommandInteraction): Promise<void>
    {
        // sending messages to the new channel is time consuming,
        // so let's defer the reply
        // more info: https://discordjs.guide/interactions/replying-to-slash-commands.html#deferred-responses
        await interaction.deferReply();

        if (!interaction.guild)
        {
            console.error("This interaction is not associated with a guild.");
            this.replyWithVagueError(interaction);
            return;
        }

        // pattern as provided by the discord user
        const PATTERN_NAME = this.getPatternOption(interaction);

        // check that there doesn't yet exist a channel for this pattern
        let channel: TextChannel | undefined = 
            this.getChannelOfPattern(interaction, PATTERN_NAME);
        if (channel)
        {
            await replyWithError(interaction, `There already exists a channel for ${PATTERN_NAME}`);
            return;
        }

        // get the pattern
        const PATTERN: Pattern | undefined = await Pattern.getCollector(PATTERN_NAME);
        if (!PATTERN)
        {
            await replyWithError(interaction, `Pattern ${PATTERN_NAME} is not a valid collector pattern.`);
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

        await this.populatePatternChannel(
            channel, PATTERN.baseColors, PATTERN.commonColors, "COMMONS"
        );
        await channel.send("=====");
        /*await this.populatePatternChannel(
            channel, PATTERN.baseColors, PATTERN.rareColors, "RARES"
        );*/

        // edit our earlier deferred response
        // we are done!
	    await interaction.editReply(`Created the ${PATTERN_NAME} channel!`);
	}

    private async populatePatternChannel(
        channel: TextChannel,
        baseColors: Color[], 
        highlightColors: Color[], 
        rarity: string
    ): Promise<void>
    {
        await channel.send("**" + rarity + ":**");
        for (let baseColor of baseColors)
        {
            for (let highlightColor of highlightColors)
            {
                const KOI_NAME: string = baseColor.name + highlightColor.name

                // draw 
    
                const HEIGHT: number = 30;
                let canvas: Canvas.Canvas = Canvas.createCanvas(250, HEIGHT);
                let context: Canvas.NodeCanvasRenderingContext2D = canvas.getContext("2d");
                
                // base color
                drawCircle(context, HEIGHT/2, baseColor.hex);
        
                // highlight color
                drawCircle(context, HEIGHT * 0.22, highlightColor.hex);
        
                // name as text 
                context.fillStyle="white";
                context.font = "20px Papyrus";
                context.fillText(KOI_NAME, HEIGHT + 10, HEIGHT * 0.7 );

                // generate message with the drawing
                let message: Message = await channel.send({ 
                    files: [new MessageAttachment(
                        canvas.toBuffer(), KOI_NAME + ".png"
                    )]
                });

                // add emojis to the message
                await message.react(this.REACTION_NEED);
                await message.react(this.REACTION_DRAGON);
            }
        }
    }
}

function drawCircle(
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

async function replyWithError(interaction: CommandInteraction, errorMessage: string): Promise<void>
{
    console.error(errorMessage);
    await interaction.editReply(errorMessage);
    return;
}

export default new CollectorCommand();