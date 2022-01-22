import { Client } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { REST } from "@discordjs/rest"
import { Routes } from "discord-api-types/v9";
import { Config } from "./util/config";
import { Logger } from "./util/logger";
import { RethrownError } from "./util/rethrownError";
import { sleep } from "./util/util";

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

function setupEvents(): void
{
    discord.once("ready", _ => Logger.log("...Ready event fired."));

    discord.on('interactionCreate', async interaction => {
        if (!interaction.isCommand()) return;
        if (interaction.commandName == "ping") 
        {
            Logger.log("Got a ping!");
            await interaction.reply("pong");
        }        
    });
}

async function setupCommands(): Promise<void>
{
    let commands = [new SlashCommandBuilder().setName('ping').setDescription('Replies with pong!')].map(command => command.toJSON());
    const rest = new REST({ version: '9' }).setToken(Config.getBotToken());

    let clientId = "767207619210248222";
    let guildId = "766828632948736002";
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
        .catch(console.error);
}

let bot = {

    /**
     * Start the bot.
     * Prereq: Set BOT_TOKEN in environment.
     * @throws if the bot could not be started.
     */
    start: async function(): Promise<void>
    {
        // if the bot is already running, there is nothing to do
        if (isBotOn)
        {
            throw new Error(
                "Cannot start the bot; it is already running. " +
                "Did you forget to call bot.stop() first? "
            );
        }

        isBotOn = true;
        Logger.log("Starting bot...");

        setupEvents();
        Logger.log("...Events set up.");
            
        await login().catch(error => { 
            throw new RethrownError(
                "Could not start the bot because there was an issue logging into discord.", 
                error
            );
        });
        Logger.log("...Logged into discord.");

        await setupCommands();
        Logger.log("...Commands set up.");

        // wait until discord is ready
        // this is not immediate after logging in, but is soon after
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
    stop: function(): void
    {
        // discord.destroy should alone work, but, 
        // if we try to login again after a destroy then stop again it hangs.
        // Weird things happen basically.
        // So, after destroy, let's recreate the discord client.
        discord.destroy()
        discord = getNewDiscordClient();
        isBotOn = false;
        Logger.log("Bot stopped.");
    }
};

export default bot;