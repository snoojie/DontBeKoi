import { Client, Interaction } from "discord.js";
import { Config } from "./util/config";
import Logger from "./util/logger";
import { CommandManager } from "./command";

import { DataAccessLayer } from "./dataAccessLayer";

let discord: Client = getNewDiscordClient();

// We record whether the bot is on or not to prevent trying to start 
// the bot when it was recently already started.
// If we instead rely on discord.isReady(),
// it is possible that discord.isReady() would return false while
// another bot.start() call is being made.
let isBotOn: boolean = false;

/**
 * @returns new discord client
 */
function getNewDiscordClient(): Client
{
    return new Client({ intents: [] });
}

/**
 * Log in to discord.
 * @throws ConfigError if BOT_TOKEN not set in environment variables.
 * @throws BotError if failed to login to discord.
 */
async function login(): Promise<void>
{    
    // get bot token
    const TOKEN: string = Config.getBotToken();

    // login to discord
    await discord.login(TOKEN)
}

/**
 * The "main" application.
 * 
 * Call Bot.start() to run the bot. 
 * This will log in to discord, set up slash commands, and set up the database.
 * 
 * Call Bot.stop() to stop the bot.
 */
const Bot = {

    /**
     * Start the bot.
     */
    start: async function(): Promise<void>
    {
        // if the bot is already running, there is nothing to do
        if (isBotOn)
        {
            Logger.log("Bot is already running.");
            return;
        }

        isBotOn = true;
        Logger.log("Starting bot...");
        
        try
        {            
            // login
            Logger.logPartial("    Logging into discord...")
            await login();
            Logger.logPartial("..Logged in.", true);

            // set up commands
            Logger.logPartial("    Setting up commands...");
            let commandManager: CommandManager = new CommandManager();
            discord.on("interactionCreate", async (interaction: Interaction) => {
                try
                {
                    await commandManager.executeCommand(interaction);
                }
                catch (error)
                {
                    Logger.error("Error occured executing the interaction.");
                    Logger.error(error);
                    Logger.error(interaction);
                }
            });
            await commandManager.run();
            Logger.logPartial("...Commands set up.", true);

            // start the database connection
            // and update the database with the latest patterns
            Logger.logPartial("    Setting up data.....")
            await DataAccessLayer.start();
            await DataAccessLayer.updatePatterns();
            Logger.logPartial(".....Data set up.", true);

            // Discord isn't ready immediately after logging in for... reasons?
            // but, since we do other stuff like the database,
            // enough time has passed
            // still, leaving this code in just in case we need it again
            /*if (!discord.isReady())
            {
                Logger.log("    Waiting to be ready...");
                await new Promise(resolve => setTimeout(resolve, 100));
            }*/

            Logger.log("Bot is ready!");
        }
        catch(error)
        {
            Logger.error(error);
            await Bot.stop();
        }
    },

    /**
     * Stop the bot.
     */
    stop: async function(): Promise<void>
    {
        Logger.log("Stopping the bot...");

        // discord.destroy should alone work, but, 
        // if we try to login again after a destroy then stop again it hangs.
        // Weird things happen basically.
        // So, after destroy, let's recreate the discord client.
        Logger.logPartial("    Disconnecting from discord...");
        discord.destroy();
        discord = getNewDiscordClient();
        Logger.logPartial("...Disconnected from discord.", true);

        Logger.logPartial("    Stopping data services.....");
        await DataAccessLayer.stop();
        Logger.logPartial(".....Data services stopped.", true);

        isBotOn = false;

        Logger.log("Bot stopped.");
    }
};

export default Bot;