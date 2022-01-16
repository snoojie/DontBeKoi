import { Client, Intents } from "discord.js";
import { Logger } from "./logger";

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
        //await this.login(process.env.BOT_TOKEN);
        const TOKEN: string = "OTE2ODM3OTI2MzE3NDg2MTcy.Yav92w.zsUg08aedA2C885eJoiQRBfBU8Y";
        return this.login(TOKEN)
            .then(_ => Logger.log("Bot ready!"))
            .catch((error: Error) => Logger.error(`Invalid bot token ${TOKEN}`, error));
    }
}