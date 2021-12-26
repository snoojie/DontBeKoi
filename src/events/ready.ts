import { Client } from "discord.js";
import { ClientEvent, Listener } from "../structures/client/clientEvent";

class ReadyEvent extends ClientEvent
{
    constructor()
	{
        super("ready", Listener.ONCE);
	}

	public async execute(client: Client): Promise<void>
    {

        // check for null users however unlikely
        if (!client.user)
        {
            console.error(
                "Client isn't ready. The client is not logged in as a user."
            );
            return;
        }

        // we are logged in!
		console.log(`Ready! Logged in as ${client.user.tag}`);
	}
}

export default new ReadyEvent();