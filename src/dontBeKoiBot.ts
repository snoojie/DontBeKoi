import { Client, Intents } from "discord.js";
import { Config } from "./util/config";
import { Logger } from "./util/logger";
import { RethrownError } from "./util/rethrownError";

export class DontBeKoiBot
{
    private static instance: DontBeKoiBot;
    private discord!: Client;

    private constructor()
    {
        this.createDiscordClient();
    }

    private createDiscordClient()
    {
        this.discord = new Client({ intents: [Intents.FLAGS.GUILDS] });
    }

    /**
     * Start the bot.
     * Prereq: Set BOT_TOKEN in environment.
     * @throws if the bot could not be started.
     */
     public async start(): Promise<void>
     {
         await this.login()
            .then(_ => Logger.log("Logged into discord."))
            .catch(error => { 
                throw new RethrownError(
                    "Could not start the bot because there was an issue logging into discord.", 
                    error
                ); 
        });
     }

     /**
     * Stops the bot.
     */
      public stop(): void
      {
          // discord.destroy should work, but, 
          // if we try to login again after a destroy then stop again
          // it hangs.
          // Weird things happen basically.
          // So, after destroy, let's recreate the discord instance.
          this.discord.destroy();
          this.createDiscordClient();
          Logger.log("Logged out of discord.");
      }

    /**
      * Log in to discord.
      * @throws if failed to login.
      */
     private async login(): Promise<void>
     {

        // get the bot token
        let botToken: string;
        try
        {
            botToken = Config.getBotToken();
        }
        catch (error)
        {
            throw new RethrownError(
                "Could not login to discord due to failing to get the bot token.", error
            );
        }
        
        // login to discord
        await this.discord.login(botToken)
            .catch(error => {
                throw new RethrownError(
                    `Could not login to discord. We could be offline, or the bot token may be invalid: ${botToken}`, 
                    error
                )
            });
     }

    /**
     * DontBeKoiBot is a singleton object.
     * Call getInstance() instead of new DontBeKoiBot().
     * @returns Instance of DontBeKoiBot
     */
    public static getInstance(): DontBeKoiBot 
    {
        if (!DontBeKoiBot.instance) 
        {
            DontBeKoiBot.instance = new DontBeKoiBot();
        }

        return DontBeKoiBot.instance;
    }

}