import { Client, Intents } from "discord.js";

export class ExtendedClient extends Client
{
    private static instance: ExtendedClient;

    private constructor()
    {
        super({ intents: [Intents.FLAGS.GUILDS] });
    }

    public static getInstance(): ExtendedClient 
    {
        if (!ExtendedClient.instance) 
        {
            ExtendedClient.instance = new ExtendedClient();
        }

        return ExtendedClient.instance;
    }

    public async start(): Promise<void>
    {
        await this.login(process.env.BOT_TOKEN);
    }
}