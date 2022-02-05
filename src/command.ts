import { CommandInteraction, Interaction } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { REST } from "@discordjs/rest"
import { Routes } from "discord-api-types/v9";
import Logger from "./util/logger";
import RethrownError from "./util/rethrownError";
import Config from "./util/config";
import * as fs from "fs";
import ErrorMessages from "./errorMessages";
import PublicError from "./util/publicError";

export interface Option
{
    name: string;
    description: string;
}

export interface Command
{
    name: string;
    description: string;
    execute: (interaction: CommandInteraction) => Promise<string>;
    options?: Option[];
    isPrivate?: boolean;
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
        await this.init();
        await this.deploy();
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
            Logger.error(ErrorMessages.COMMAND_MANAGER.UNKNOWN_INTERACTON);
            Logger.error(interaction);
            return;
        }

        // ignore unknown commands 
        // though this shouldn't happen
        if (!this.commands.has(interaction.commandName))
        {
            Logger.error(
                ErrorMessages.COMMAND_MANAGER.UNKNOWN_COMMAND + " " + 
                interaction.commandName
            );
            return;
        }

        // we know this is a valid command,
        // so get it
        const COMMAND: Command = this.commands.get(interaction.commandName)!;

        // defer the reply
        await interaction.deferReply({
            ephemeral: COMMAND.isPrivate
        });

        // log the command
        let logMessage: string = 
            `${interaction.user.username}: /${interaction.commandName}`;
        if (COMMAND.options)
        {
            for (const OPTION of COMMAND.options)
            {
                logMessage += 
                    ` ${OPTION.name}:${interaction.options.getString(OPTION.name)}`;
            }
        }
        Logger.log(logMessage);
        console.time(logMessage);

        // execute the command
        const REPLY: string = await COMMAND.execute(interaction)
            .catch(error => {
                if (error instanceof PublicError)
                {
                    return error.message;
                }
                Logger.error(ErrorMessages.COMMAND_MANAGER.FAILED_COMMAND_EXECUTION);
                Logger.error(error);
                return "Uh oh. Something went wrong.";
            });
        
        // print the amount of time this command took
        console.timeEnd(logMessage);        

        // reply 
        await interaction.editReply(REPLY)
            //todo
            //DiscordAPIError: Unknown interaction
            //happens when bot logged in elsewhere
            .catch(Logger.error); 
    }

    /**
     * Sets this.commands by reading from the commands/ directory.
     * @throws if there was an issue initializing any command.
     */
    private async init(): Promise<void>
    {
        // confirm the commands/ directory exists
        const DIRECTORY: string = "commands";
        const DIRECTORY_FULL_PATH: string = `${__dirname}/${DIRECTORY}`;
        if (!fs.existsSync(DIRECTORY_FULL_PATH))
        {
            throw new Error(ErrorMessages.COMMAND_MANAGER.MISSING_COMMANDS_DIRECTORY);
        }

        const FILES: string[] = fs.readdirSync(DIRECTORY_FULL_PATH);
        for (const FILE of FILES)
        {
            // ignore non js/ts files
            // this could happen if there's a .js.map file
            if (!FILE.endsWith(".js") && !FILE.endsWith(".ts"))
            {
                continue;
            }

            // remove the .js or .ts extension
            const FILE_RELATIVE_PATH: string = `./${DIRECTORY}/${FILE.slice(0,-3)}`;

            // import the script
            const SCRIPT = await import(FILE_RELATIVE_PATH);
                    
            // ensure the script has a default export
            const COMMAND = SCRIPT.default;
            if (!COMMAND)
            {
                throw new Error(
                    ErrorMessages.COMMAND_MANAGER
                        .COMMAND_SCRIPT_MISSING_DEFAULT_EXPORT + 
                    " " + FILE_RELATIVE_PATH
                );
            }

            // ensure the command is actually a command
            if (!this.isCommand(COMMAND))
            {
                throw new Error(
                    ErrorMessages.COMMAND_MANAGER.IS_NOT_COMMAND + " " + 
                    FILE_RELATIVE_PATH
                );
            }

            // ensure we do not already have a command by this name
            if (this.commands.has(COMMAND.name))
            {
                throw new Error(
                    ErrorMessages.COMMAND_MANAGER.DUPLICATE_COMMAND + " " + COMMAND.name
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
        // get config variables
        const TOKEN: string = Config.getBotToken();
        const CLIENT_ID: string = Config.getClientId();
        const GUILD_ID: string = Config.getGuildId();

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
                    .setDescription(COMMAND.description);
                if (COMMAND.options)
                {
                    for (const OPTION of COMMAND.options)
                    {
                        commandBuilder.addStringOption(option => 
                            option.setName(OPTION.name)
                                .setDescription(OPTION.description)
                                .setRequired(true)
                        );
                    }
                }
            }
            catch(error)
            {
                throw new RethrownError(
                    ErrorMessages.COMMAND_MANAGER.CANNOT_BUILD_COMMAND + " " + 
                    COMMAND_NAME,
                    error
                );
            }
            commandBuilders.push(commandBuilder);
        }

        // finally deploy the commands 
        await new REST({ version: "9" })
            .setToken(TOKEN)
            .put(
                Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
                { body: commandBuilders.map(commandBuilder => commandBuilder.toJSON()) }
            )
            .catch(error => {
                throw new RethrownError(
                    ErrorMessages.COMMAND_MANAGER.FAILED_COMMAND_DEPLOYMENT,
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

/**
 * Checks if the provided object is a string with at least one character.
 * @param object object to check if a defined string
 * @returns boolean
 */
function isDefinedString(object: string): boolean
{
    return object !== undefined && typeof object === "string" && object !== "";
}