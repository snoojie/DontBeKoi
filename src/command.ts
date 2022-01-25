import { CommandInteraction, Interaction } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { REST } from "@discordjs/rest"
import { Routes } from "discord-api-types/v9";
import Logger from "./util/logger";
import { RethrownError } from "./util/rethrownError";
import Config from "./util/config";
import { isDefinedString } from "./util/common";
import * as fs from "fs";

export interface Command
{
    name: string;
    description: string;
    execute: (interaction: CommandInteraction) => Promise<string>;
}

type CommandCollection = Map<string, Command>;

export class CommandManager
{
    private commands: CommandCollection;

    constructor()
    {
        this.commands = new Map();
    }

    /**
     * Deploys commands from commands/ directory to the discord server.
     * @throws if commands could not be deployed.
     */
    public async run(): Promise<void>
    {
        await this.init()
            .catch(error => {
                throw new RethrownError(
                    "Cannot run CommandManager. There was an issue initializing " +
                    "the commands.", 
                    error
                );
            })

        await this.deploy()
            .catch(error => {
                throw new RethrownError(
                    "Cannot run CommandManager. There was an issue deploying commands.",
                    error
                );
            })
    }

    /**
     * Executes the command defined by the interaction.
     * Errors are logged instead of thrown.
     * @param interaction Interaction the command took place in.
     */
    public async executeCommand(interaction: Interaction): Promise<void>
    {
        // ignore non commands
        // though this shouldn't happen
        if (!interaction.isCommand())
        {
            Logger.error("Cannot respond to interaction because it is not a command.");
            Logger.error(interaction);
            return;
        }

        // ignore unknown commands 
        // though this shouldn't happen
        if (!this.commands.has(interaction.commandName))
        {
            Logger.error(
                "Cannot respond to interaction because it is an unknown command: " +
                interaction.commandName
            );
            return;
        }

        // we know this is a valid command,
        // so get it
        const COMMAND: Command = this.commands.get(interaction.commandName)!;

        // execute the command
        const REPLY: string = await COMMAND.execute(interaction)
            .catch(error => {
                // todo
                Logger.error(error);
                return "Uh oh. Something went wrong.";
            });

        // reply 
        await interaction.reply(REPLY)
            //todo
            //DiscordAPIError: Unknown interaction
            //happens when bot logged in elsewhere
            .catch(Logger.error); 
    }

    /**
     * Sets this.commands by reading from the commands/ directory.
     */
    private async init(): Promise<void>
    {
        // confirm the commands/ directory exists
        const DIRECTORY: string = "commands";
        const DIRECTORY_RELATIVE_PATH: string = `./src/${DIRECTORY}`;
        if (!fs.existsSync(DIRECTORY_RELATIVE_PATH))
        {
            throw new Error(
                "Cannot init commands. The commands directory is missing."
            );
        }

        const FILES: string[] = fs.readdirSync(DIRECTORY_RELATIVE_PATH);
        for (const FILE of FILES)
        {
            // remove the .js extension
            if (FILE.endsWith(".js") || FILE.length < 3)
            {
                throw new Error(
                    `Cannot init commands. The command directory has a file that ` +
                    `isn't javascript: ${FILE}`
                );
            }
            const FILE_RELATIVE_PATH: string = `./${DIRECTORY}/${FILE.slice(0,-3)}`;

            // import the script
            const SCRIPT = await import(FILE_RELATIVE_PATH)
                .catch(error => {
                    throw new RethrownError(
                        `Cannot init commands. The following script could not be ` +
                        `loaded: ${FILE_RELATIVE_PATH}`,
                        error
                    );
                });
                    
            // ensure the script has a default export
            const COMMAND = SCRIPT.default;
            if (!COMMAND)
            {
                throw new Error(
                    `Cannot init commands. The following script does not have a ` +
                    `default export: ${FILE_RELATIVE_PATH}`
                );
            }

            // ensure the command is actually a command
            if (!this.isCommand(COMMAND))
            {
                throw new Error(
                    `Cannot init commands. The default export of the following ` +
                    `script is not of type command: ${FILE_RELATIVE_PATH}`
                );
            }

            // ensure we do not already have a command by this name
            if (this.commands.has(COMMAND.name))
            {
                throw new Error(
                    `Cannot init commands. The commands directory has multiple ` +
                    `commands of the same name: ${COMMAND.name}`
                );
            }

            // got the command!
            this.commands.set(COMMAND.name, COMMAND);
        }
    }

    /**
     * Deploys commands to the discord server.
     * @throws if commands could not be deployed.
     */
    private async deploy(): Promise<void>
    {
        // get config variables bot token, client ID, and guild ID
        let token: string;
        let clientId: string;
        let guildId: string;
        try
        {
            token = Config.getBotToken();
        }
        catch (error)
        {
            throw new RethrownError(
                "Could not deploy commands. Could not get the bot token.", 
                error
            );
        }
        try
        {
            clientId = Config.getClientId();
        }
        catch (error)
        {
            throw new RethrownError(
                "Could not deploy commands. Could not get the client ID.", 
                error
            );
        }
        try
        {
            guildId = Config.getGuildId();
        }
        catch (error)
        {
            throw new RethrownError(
                "Could not deploy commands. Could not get the guild ID.", 
                error
            );
        }

        // build the commands
        // we need to do this to get the JSON for the REST call
        let commandBuilders: SlashCommandBuilder[] = [];
        for (const [COMMAND_NAME, COMMAND] of this.commands)
        {
            let commandBuilder: SlashCommandBuilder;
            try
            {
                commandBuilder = new SlashCommandBuilder()
                    .setName(COMMAND_NAME)
                    .setDescription(COMMAND.description)
            }
            catch(error)
            {
                throw new RethrownError(
                    `Could not deploy commands. There was an issue with building the ` +
                    `following command: ${COMMAND_NAME}`, 
                    error
                );
            }
            commandBuilders.push(commandBuilder);
        }

        // finally deploy the commands 
        await new REST({ version: "9" })
            .setToken(token)
            .put(
                Routes.applicationGuildCommands(clientId, guildId),
                { body: commandBuilders.map(commandBuilder => commandBuilder.toJSON()) }
            )
            .catch(error => {
                throw new RethrownError(
                    `Could not deploy commands. Could the client ID ${clientId} or ` +
                    `guild ID ${guildId} be wrong?`,
                    error
                );
            });
    }

    /**
     * Checks if the provided object is an instance of Command
     * @param object object to check if it is an instance of Command
     * @returns boolean
     */
    private isCommand(object: any): object is Command 
    {
        const COMMAND = object as Command;

        // name must be a defined string with no spaces
        return isDefinedString(COMMAND.name) && COMMAND.name.indexOf(" ") < 0 &&

               // description must be a defined string
               isDefinedString(COMMAND.description) &&

               // execute must be a defined function
               COMMAND.execute !== undefined && typeof COMMAND.execute === "function"
    }
}