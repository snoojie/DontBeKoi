import { Client } from "discord.js";
import { Config } from "./util/config";
import { Logger } from "./util/logger";
import { RethrownError } from "./util/rethrownError";

let discord: Client = getNewDiscordClient();

/**
 * @returns new discord client
 */
function getNewDiscordClient(): Client
{
    return new Client({ intents: [] });
}

/**
 * Log in to discord.
 * @throws if failed to login.
 */
async function login(): Promise<void>
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
    await discord.login(botToken)
        .catch(error => {
            throw new RethrownError(
                `Could not login to discord. We could be offline, or the bot token may be invalid: ${botToken}`, 
                error
            )
        });
}

let bot = {

    tmp: 5,

    /**
     * Start the bot.
     * Prereq: Set BOT_TOKEN in environment.
     * @throws if the bot could not be started.
     */
    start: async function(): Promise<void>
    {
        // if the bot is already running, there is nothing to do
        if (discord.isReady())
        {
            throw new Error(
                "Cannot start the bot; it is already running. " +
                "Did you forget to call bot.stop() first? "
            );
        }

        Logger.log("Starting bot....");

        // Once logged into the client, the bot is not necessarily ready, 
        // so we need to delay returning this function until the bot is ready.
        // We know it is ready via the ready event.
        // To wait for the ready event, we return a promise.
        return new Promise((resolve, reject) => {

            // set up the ready event before we log in
            discord.once("ready", _ => {
                Logger.log("Bot is ready!");
                resolve();
            });

            // log in
            login()
                .then(_ => Logger.log("Logged into discord."))
                .catch(error => { 
                    reject(new RethrownError(
                        "Could not start the bot because there was an issue logging into discord.", 
                        error
                    ));
                });

        });
    },

    /**
     * Stop the bot.
     */
    stop: function(): void
    {
        // discord.destroy should alone work, but, 
        // if we try to login again after a destroy then stop again it hangs.
        // Weird things happen basically.
        // So, after destroy, let's recreate the discord client.
        discord.destroy()
        discord = getNewDiscordClient();
        Logger.log("Bot stopped.");
    }
};

export default bot;