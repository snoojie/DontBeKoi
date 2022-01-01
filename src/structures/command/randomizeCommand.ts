import { Command } from "./command";

export abstract class RandomizeCommand extends Command
{
    constructor(name: string, description: string)
	{
        super(name, description);
	}

    // https://medium.com/@rocambille/how-to-roll-a-dice-in-javascript-ec543f8ffda1
    protected random(min: number, max: number): number
    {
        return min + Math.floor(Math.random() * (max-min + 1));
    }
}