import { CommandInteraction, GuildBasedChannel, Message, MessageAttachment, TextChannel } from "discord.js";
import { KoiCommand } from "../structures/command/koiCommand";
import { PatternCollection, KoiColoring } from "../patternUtil";
import * as Canvas from "canvas";

class CollectorCommand extends KoiCommand
{
    constructor()
	{
        super("collector", "Create collector channel");
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
            replyWithVagueError(interaction);
            return;
        }

        // pattern as provided by the discord user
        let pattern = this.getPattern(interaction);

        // check that there doesn't yet exist a channel for this pattern
        let channel: TextChannel | undefined = 
            this.getChannelOfPattern(interaction, pattern);
        if (channel)
        {
            console.error("There already exists a channel for " + pattern);
            interaction.editReply("There already exists a channel for " + pattern);
            return;
        }

        // get the pattern collection
        let patternCollection: PatternCollection | undefined = undefined;
        try 
        {
            patternCollection = await this.getPatternCollection(pattern);
        }
        catch(error)
        {
            console.error(error);
            await interaction.editReply(error);
            return;
        }
        if (!patternCollection)
        {
            console.error("Pattern collection is empty, somehow without error");
            replyWithVagueError(interaction);
            return;
        }
        
        // create channel for this pattern
        channel = <TextChannel>await interaction.guild.channels.create(
            pattern + " - " + patternCollection.hatchTime, 
            { 
                parent: process.env.CATEGORY_ID
            }
        );

        // populate the new channel
        await populatePatternChannel(channel, patternCollection.commons, "commons");
        await channel.send("=====");
        await populatePatternChannel(channel, patternCollection.rares, "rares");

        // edit our earlier deferred response
        // we are done!
	    await interaction.editReply(`Created the ${pattern} channel!`);
	}
}

function replyWithVagueError(interaction: CommandInteraction)
{
    interaction.editReply("Uh oh. Something went wrong.");
}

async function populatePatternChannel(
    channel: TextChannel, collection: KoiColoring[], rarity: string
): Promise<void>
{
    await channel.send("**" + rarity.toUpperCase() + ":**");
    for (let koi of collection)
    {
        // draw 

        const HEIGHT: number = 30;
        let canvas: Canvas.Canvas = Canvas.createCanvas(250, HEIGHT);
        let context: Canvas.NodeCanvasRenderingContext2D = canvas.getContext("2d");
        
        // base color
        drawCircle(context, HEIGHT/2, koi.baseColor);

        // highlight color
        drawCircle(context, HEIGHT * 0.22, koi.highlightColor);

        // name as text 
        context.fillStyle="white";
        context.font = "20px Papyrus";
        context.fillText(koi.name, HEIGHT + 10, HEIGHT * 0.7 );

        let message: Message = await channel.send({ 
            files: [new MessageAttachment(
                canvas.toBuffer(), koi.name + ".png"
            )]
        });

        await message.react("🎣");
        await message.react("🐉");
    }
}

function drawCircle(
    context: Canvas.NodeCanvasRenderingContext2D, radius: number, color: string
): void
{
    // the circle's center (x, y) is half the canvas height
    const CIRCLE_CENTER = context.canvas.height / 2;

    // drawing a circle requires the start and end angles for the arc function
    const CIRCLE_START_ANGLE = 0;
    const CIRCLE_END_ANGLE = 2 * Math.PI;

    context.beginPath();
    context.arc(CIRCLE_CENTER, CIRCLE_CENTER, radius, CIRCLE_START_ANGLE, CIRCLE_END_ANGLE);
    context.fillStyle = color;
    context.fill();
}

export default new CollectorCommand();