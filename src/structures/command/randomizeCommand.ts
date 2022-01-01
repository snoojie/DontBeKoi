import { Command } from "./command";

export abstract class RandomizeCommand extends Command
{
    constructor(name: string, description: string)
	{
        super(name, description);
	}

    // https://medium.com/@rocambille/how-to-roll-a-dice-in-javascript-ec543f8ffda1
    /**
     * @param min The min number that can be returned.
     * @param max The max number that can be returned.
     * @returns random int between [min, max] inclusive.
     * @throws if max < min
     */
    protected random(min: number, max: number): number
    {
        if (max < min)
        {
            throw `Can't randomize when max ${max} < min ${min}.`;
        }
        return min + Math.floor(Math.random() * (max-min + 1));
    }
}