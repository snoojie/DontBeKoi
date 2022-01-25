import { Client, Interaction } from "discord.js";
import Config from "./util/config";
import Logger from "./util/logger";
import RethrownError from "./util/rethrownError";
import { sleep } from "./util/common";
import { CommandManager } from "./command";
import db from "./db/db";

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
    let token: string;
    try {
        token = Config.getBotToken();
    }
    catch(error) 
    {
        throw new RethrownError(
            "Could not login to discord. The bot token is not availble.", 
            error
        );
    }

    // login to discord
    await discord.login(token)
        .catch(error => {
            throw new RethrownError(
                `Could not login to discord. ` +
                `We could be offline or the bot token may be invalid: ${token}`, 
                error
            )
        });
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
            throw new Error(
                "Cannot start the bot. It is already running. " +
                "Did you forget to call bot.stop() first? "
            );
        }

        isBotOn = true;
        Logger.log("Starting bot...");

        let awaitingOn: Promise<any>[] = [];

        // log when discord is ready
        discord.once("ready", _ => Logger.log("...Ready event fired."));
        
        // login
        // cannot do this at the same time as setting up database with awaitingOn
        // for some reason, if the db fails, if we logged in at the same time,
        // the program will hang
        await login()
            .then(_ => Logger.log("...Logged into discord."))
            .catch(error => { 
                throw new RethrownError(
                    "Could not start the bot. There was an issue logging into discord.", 
                    error
                );
            });     

        // set up commands
        let commandManager: CommandManager = new CommandManager();
        discord.on("interactionCreate", async (interaction: Interaction) => { 
            commandManager.executeCommand(interaction);
        });
        awaitingOn.push(commandManager.run()
            .then(_ => Logger.log("...Commands set up."))
            .catch(error => {
                throw new RethrownError(
                    "Could not start the bot. There was an issue setting up the commands.",
                    error
                );
            })
        );

        // set up database
        awaitingOn.push(db.start()
            .then(_ => Logger.log("...Database set up."))
            .catch(error => {
                throw new RethrownError(
                    "Could not start the bot. There was an issue with the database.",
                    error
                );
            })
        );

        // wait for everything we are waiting on (login, set up commands, database)
        await Promise.all(awaitingOn);

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

        await db.stop();

        isBotOn = false;


        Logger.log("Bot stopped.");
    }
};

export default Bot;