import { CommandInteraction } from "discord.js";
import { Command } from "../command";

let ping: Command = {

    name: "ping",

    description: "Replies with pong",
    
    execute: async function (interaction: CommandInteraction): Promise<string> {
        console.log(interaction.commandName);
        return "pong";
    }

};

export default ping;