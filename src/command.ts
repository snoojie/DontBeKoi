import { CommandInteraction } from "discord.js";

export interface Command
{
    name: string;
    description: string;
    execute: (interaction: CommandInteraction) => Promise<string>;
}

export function isCommand(object: any): object is Command {
    let command = object as Command;
    return command.name !== undefined &&
           command.description !== undefined &&
           command.execute !== undefined;
  }