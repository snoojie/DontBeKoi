import { CommandInteraction } from "discord.js";
import { Command } from "../command";

const RollCommand: Command = {

    name: "roll",

    description: "Roll a dice.",

    options: [
        { name: "sides", type: "number", description: "Number of sides this dice has." },
    ],
    
    execute: async function (interaction: CommandInteraction): Promise<string>
    {
        // get sides option
        const SIDES: number | null = interaction.options.getNumber("sides");

        // blow up if sides option wasn't provided
        // this should never happen
        if (SIDES == null)
        {
            throw new Error(
                "The 'sides' option is required. "+
                "How did this command get executed without that?"
            );
        }

        // the dice needs at least 2 sides
        if (SIDES < 2)
        {
            return "The dice needs at least 2 sides.";
        }
        
        const RANDOM: number = random(1, SIDES);

        return `Rolling a ${SIDES} sided dice.... ${RANDOM}`;
    }

};

export default RollCommand; 
 
 
// https://medium.com/@rocambille/how-to-roll-a-dice-in-javascript-ec543f8ffda1
/**
 * @param min The min number that can be returned.
 * @param max The max number that can be returned.
 * @returns random int between [min, max] inclusive.
 */
function random(min: number, max: number): number
{
    return min + Math.floor(Math.random() * (max-min + 1));
}