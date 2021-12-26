import { Interaction, CommandInteraction } from "discord.js";
import { ClientEvent, Listener } from "../structures/client/clientEvent";
import { Command } from "../structures/command/command";
import { ExtendedClient } from "../structures/client/extendedClient";

class InteractionCreateEvent extends ClientEvent
{
    constructor()
	{
        super("interactionCreate");
	}

	public async execute(interaction: Interaction): Promise<void>
    {
        if (!interaction.isCommand())
        {
            return;
        }

        let commandInteraction = <CommandInteraction>interaction;
        let client: ExtendedClient = <ExtendedClient>commandInteraction.client;
        const COMMAND_NAME = commandInteraction.commandName;
        let command: Command | undefined = client.getCommand(COMMAND_NAME);
        if (!command)
        {
            console.error("Unknown command " + COMMAND_NAME);
            return;
        }
        await command.execute(commandInteraction);
	}
}

export default new InteractionCreateEvent();