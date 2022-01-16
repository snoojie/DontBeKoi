import { Client, Intents } from "discord.js";
import { Config } from "./config";
import { Logger } from "./logger";

export class ExtendedClient extends Client
{
    private static instance: ExtendedClient;

    private constructor()
    {
        super({ intents: [Intents.FLAGS.GUILDS] });
    }

    /**
     * ExtendedClient is a singleton object.
     * Call getInstance() instead of new ExtendedClient().
     * @returns Instance of extended client
     */
    public static getInstance(): ExtendedClient 
    {
        if (!ExtendedClient.instance) 
        {
            ExtendedClient.instance = new ExtendedClient();
        }

        return ExtendedClient.instance;
    }

    /**
     * Login to discord.
     */
    public async start(): Promise<void>
    {
        let botToken: string;
        try
        {
            botToken = Config.getBotToken();
        }
        catch (error)
        {
            Logger.error("Bot token is not configured.", error);
            return;
        }
        
        return this.login(botToken)
            .then(_ => Logger.log("Bot ready!"))
            .catch((error: Error) => Logger.error(`Invalid bot token: ${botToken}`, error));
    }
}