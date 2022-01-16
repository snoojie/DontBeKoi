import { Client, Intents } from "discord.js";
import { Config } from "./config";
import { Logger } from "./logger";
import * as fs from "fs";

export class DontBeKoiBot
{
    private static instance: DontBeKoiBot;
    private discord: Client;

    private constructor()
    {
        this.discord = new Client({ intents: [Intents.FLAGS.GUILDS] });
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

    /**
     * Start the bot.
     */
     public async start(): Promise<void>
     {
         //await this.setupEvents().then(_ => Logger.log("Events are set up."));
         await this.login()
            .then(_ => Logger.log("Logged into discord."))
            .catch(error => Logger.error("Failed to log in to discord.", error));
     }

     private async setupEvents(): Promise<void>
     {
        await this.loadScripts("events")
            .catch((error: Error) => 
                Logger.error("Failed to setup events.", error)

            );
     }

     /**
      * Log in to discord.
      * @throws if failed to login.
      */
     private async login(): Promise<void>
     {
        let botToken: string;
        try
        {
            botToken = Config.getBotToken();
        }
        catch (error)
        {
            //Logger.error("Bot token is not configured.", error);
            throw new Error("Bot token is not configured.");
        }
        
        await this.discord.login(botToken)
            .catch(function(error: Error) {
               Logger.error(`Invalid bot token: ${botToken}`, error);
               throw error;
            });
     }

     private async loadScripts(directory: string): Promise<any[]>
     {
         let scripts: any[] = [];
     
         const RELATIVE_PATH = `./src/${directory}`;
         if (!fs.existsSync(RELATIVE_PATH))
         {
             throw new Error(`Directory does not exist: ${RELATIVE_PATH}`);
         }
         let files: string[] = fs.readdirSync(RELATIVE_PATH);
         /*for (let file of files)
         {
             file = file.slice(0,-3);
             let script = await import(`../../${directory}/${file}`);
             scripts.push(script.default);
         }*/
     
         return scripts;
     }
}