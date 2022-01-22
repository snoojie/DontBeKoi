import { Client } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { REST } from "@discordjs/rest"
import { Routes } from "discord-api-types/v9";
import Config from "./util/config";
import { Logger } from "./util/logger";
import { RethrownError } from "./util/rethrownError";
import { sleep } from "./util/util";
import { Command, isCommand } from "./command";
import * as fs from "fs"

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
async function login(token: string): Promise<void>
{    
    // login to discord
    await discord.login(token)
        .catch(error => {
            
            throw new RethrownError(
                `Could not login to discord. We could be offline, or the bot token may be invalid: ${token}`, 
                error
            )
        });
}

type CommandCollection = Map<string, Command>;

async function loadCommands(): Promise<CommandCollection>
{
    let commands: CommandCollection = new Map();
    
    const DIRECTORY: string = "commands";

    const DIRECTORY_RELATIVE_PATH: string = `./src/${DIRECTORY}`;

    // confirm the directory exists
    if (!fs.existsSync(DIRECTORY_RELATIVE_PATH))
    {
        throw new Error(`Cannot load commands from non existant directory: ${DIRECTORY}`);
    }

    const FILES: string[] = fs.readdirSync(DIRECTORY_RELATIVE_PATH);
    for (const FILE of FILES)
    {
        // ignore non js files
        if (FILE.endsWith(".js") || FILE.length < 3)
        {
            continue;
        }

        // import the script
        // note we need to remove the ".js" extension
        const FILE_RELATIVE_PATH = `./${DIRECTORY}/${FILE.slice(0,-3)}`;
        let script = await import(FILE_RELATIVE_PATH)
            .catch(error => {
                throw new RethrownError(
                    `Cannot load command: ${FILE_RELATIVE_PATH}`,
                    error
                );
            });
                
        // ensure the script has a default export
        const COMMAND = script.default;
        if (!COMMAND)
        {
            throw new Error(
                `Cannot load command ${FILE_RELATIVE_PATH} because it does not ` +
                `have a default export.`
            );
        }

        // ensure the command is actually a command
        if (!isCommand(COMMAND))
        {
            throw new Error(
                `Cannot load command ${FILE_RELATIVE_PATH} because it is `+
                `not of type command.`
            );
        }

        commands.set(COMMAND.name, COMMAND);
    }

    return commands;
}

async function setupCommands(token: string): Promise<void>
{
    // get the client ID of the bot
    let clientId: string;
    try
    {
        clientId = Config.getClientId();
    }
    catch(error) 
    {
        throw new RethrownError(
            "Cannot setup commands because cannot get the client ID.", error
        );
    }

    // get the guild ID of the discord server the bot is in
    let guildId: string;
    try
    {
        guildId = Config.getGuildId();
    }
    catch(error) 
    {
        throw new RethrownError(
            "Cannot setup commands because cannot get the guild ID.", error
        );
    }

    // get commands from the /commands directory
    const COMMANDS: CommandCollection = await loadCommands()
        .catch(error => { 
            throw new RethrownError(
                "Cannot setup commands because there was an issue with loading them.", 
                error
            );
        });

    // init slash command builders
    let commandBuilders: SlashCommandBuilder[] = [];
    for (const [COMMAND_NAME, COMMAND] of COMMANDS)
    {
        commandBuilders.push(
            new SlashCommandBuilder()
                .setName(COMMAND_NAME)
                .setDescription(COMMAND.description)
        );
    }

    // set these commands on the bot
    await new REST({ version: "9" })
        .setToken(token)
        .put(
            Routes.applicationGuildCommands(clientId, guildId), 
            { body: commandBuilders.map(commandBuilder => commandBuilder.toJSON()) }
        )
        .catch(error => {
            throw new RethrownError(
                `Could not setup commands. Could the client ID ${clientId} or guild ID ${guildId} be wrong?`,
                error
            );
        });
    
    // set up eventing to respond to the commands
    discord.on("interactionCreate", async interaction => {
        
        // ignore non commands
        // though this shouldn't happen
        if (!interaction.isCommand())
        {
            Logger.error("Got an interaction but it isn't a command:");
            Logger.error(interaction);
            return;
        }

        // ignore unknown commands 
        // though this shouldn't happen
        const COMMAND: Command | undefined = COMMANDS.get(interaction.commandName);
        if (!COMMAND)
        {
            Logger.error(`Unknown command: ${interaction.commandName}`);
            Logger.error(interaction);
            return;
        }

        let reply: string = await COMMAND.execute(interaction);
        await interaction.reply(reply)
            //todo
            //DiscordAPIError: Unknown interaction
            //happens when bot logged in elsewhere
            .catch(Logger.error); 
    });    
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

        let token: string;
        try {
            token = Config.getBotToken();
        }
        catch(error) 
        {
            throw new RethrownError(
                "Could not start the bot because the bot token is not availble.", 
                error
            );
        }

        discord.once("ready", _ => Logger.log("...Ready event fired."));
            
        await login(token).catch(error => { 
            throw new RethrownError(
                "Could not start the bot because there was an issue logging into discord.", 
                error
            );
        });
        Logger.log("...Logged into discord.");

        await setupCommands(token);
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