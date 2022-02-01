import { Client, Interaction } from "discord.js";
import Config from "./util/config";
import Logger from "./util/logger";
import { CommandManager } from "./command";
import Database from "./database/database";
import ErrorMessages from "./errorMessages";
import RethrownError from "./util/rethrownError";

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
 * @param token The discord bot token.
 * @throws if failed to login.
 */
async function login(): Promise<void>
{    
    // get bot token
    const TOKEN: string = Config.getBotToken();

    // login to discord
    await discord.login(TOKEN)
        .catch(error => {
            throw new RethrownError(ErrorMessages.BOT.FAILED_LOGIN, error);
        })
}

/**
 * Sleep for a certain amount of time.
 * @param ms How long to sleep in milliseconds.
 * @returns after the provided ms time.
 */
async function sleep(ms: number): Promise<void>
{
    return new Promise(resolve => setTimeout(resolve, ms));
}

const Bot = {

    /**
     * Start the bot.
     * @throws if the bot could not be started.
     */
    start: async function(): Promise<void>
    {
        // if the bot is already running, there is nothing to do
        if (isBotOn)
        {
            throw new Error(ErrorMessages.BOT.ALREADY_RUNNING);
        }

        isBotOn = true;
        Logger.log("Starting bot...");

        try
        {
            // log when discord is ready
            discord.once("ready", _ => Logger.log("...Ready event fired."));
            
            // login
            // cannot do this at the same time as setting up database with awaitingOn
            // for some reason, if the database fails, if we logged in at the same time,
            // the program will hang
            await login()
                .then(_ => Logger.log("...Logged into discord."));

            // set up commands
            let commandManager: CommandManager = new CommandManager();
            discord.on("interactionCreate", async (interaction: Interaction) => { 
                commandManager.executeCommand(interaction);
            });
            await commandManager.run()
                .then(_ => Logger.log("...Commands set up."));

            // set up database
            await Database.start()
                .then(_ => Logger.log("...Database set up."));

            // Wait until discord is ready.
            // This is not immediate after logging in, but is soon after.
            // We most likely do not need to wait though due to the time 
            // it takes to set up commands.
            if (!discord.isReady())
            {
                Logger.log("...Waiting to be ready.");
                await sleep(100);
            }

            Logger.log("Bot is ready!");
        }
        catch(error)
        {
            await Bot.stop();
            throw error;
        }
    },

    /**
     * Stop the bot.
     */
    stop: async function(): Promise<void>
    {
        // discord.destroy should alone work, but, 
        // if we try to login again after a destroy then stop again it hangs.
        // Weird things happen basically.
        // So, after destroy, let's recreate the discord client.
        discord.destroy();
        discord = getNewDiscordClient();

        await Database.stop();

        isBotOn = false;


        Logger.log("Bot stopped.");
    }
};

export default Bot;