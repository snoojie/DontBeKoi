import { CommandInteraction, Interaction } from "discord.js";
import { SlashCommandBuilder, SlashCommandStringOption, SlashCommandNumberOption } from "@discordjs/builders";
import { REST } from "@discordjs/rest"
import { Routes } from "discord-api-types/v9";
import Logger from "./util/logger";
import RethrownError from "./util/rethrownError";
import { Config } from "./util/config";
import * as fs from "fs";
import ErrorMessages from "./errorMessages";
import PublicError from "./util/publicError";
import EnhancedError from "./util/enhancedError";

export class CommandManagerError extends EnhancedError {}

export class InvalidCommand extends CommandManagerError
{
    constructor(file: string, reason: string)
    {
        super(`${file} is not a valid command script. ` + reason);
    }
}

export class InvalidCommandName extends InvalidCommand
{
    constructor(file: string)
    {
        super(file, "dsf");
    }
}

export interface Option
{
    name: string;
    description: string;
    type?: "string" | "number";
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
        await this.loadCommandScripts();
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
                const VALUE: string = "" + (OPTION.type == "number" 
                    ? interaction.options.getNumber(OPTION.name)
                    : interaction.options.getString(OPTION.name));
                logMessage += ` ${OPTION.name}:${VALUE}`;
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
     * @throws InvalidCommand if a command script does not have a valid command
     * @throws CommandManagerError if the commands/ directory does not exist.
     */
    private async loadCommandScripts(): Promise<void>
    {
        // confirm the commands/ directory exists
        const DIRECTORY: string = "commands";
        const DIRECTORY_FULL_PATH: string = `${__dirname}/${DIRECTORY}`;
        if (!fs.existsSync(DIRECTORY_FULL_PATH))
        {
            throw new CommandManagerError("The commands directory is missing.");
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
            let command = SCRIPT.default;
            if (!command)
            {
                throw new InvalidCommand(FILE, "Missing a default export.");
            }

            this.validateCommand(command, FILE);

            // ensure we don't already have a command by this name
            if (this.commands.has(command.name))
            {
                throw new InvalidCommand(
                    FILE, 
                    `There exists multiple commands with the same name ` +
                    `'${command.name}'.`
                );
            }

            // save the command is valid!
            this.commands.set(command.name, command);
        }
    }

    /**
     * Deploys commands to the discord server.
     * @throws ConfigError if environment variables were not set.
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
            let commandBuilder: SlashCommandBuilder = new SlashCommandBuilder()
                .setName(COMMAND_NAME)
                .setDescription(COMMAND.description);
            if (COMMAND.options)
            {
                for (const OPTION of COMMAND.options)
                {
                    if (OPTION.type == "number")
                    {
                        commandBuilder.addNumberOption(option => 
                            <SlashCommandNumberOption>buildOptionProperties(option)
                        );
                    }
                    else // string
                    {
                        commandBuilder.addStringOption(option => 
                            <SlashCommandStringOption>buildOptionProperties(option)
                        );
                    }

                    function buildOptionProperties(
                        option: SlashCommandStringOption | SlashCommandNumberOption
                    ): SlashCommandStringOption | SlashCommandNumberOption
                    {
                        return option.setName(OPTION.name)
                            .setDescription(OPTION.description)
                            .setRequired(true);
                    }
                }
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
     * Validates if a supposed command object is a command.
     * This is useful to run against new command scripts in the commands/ directory.
     * @param command The supposed command object to test.
     * @param file File script name the command is from. 
     *             This is used for building the error message.
     * @throws InvalidCommand if this is not a valid command.
     */
    private validateCommand(command: Command, file: string)
    {
        const COMMAND_NAME_FORMAT: string = 
            "Use lowercase letters, numbers, underscores, and dashes only.";
        
        // validate name
        validateName(command.name, `The command name '${command.name}'`);

        // validate description
        validateDescription(
            command.description,
            `The description '${command.description}' on command '${command.name}'`
        );

        // validate the execute function
        const EXECUTE_MESSAGE_PREFIX: string = 
            `The execute property on command '${command.name}'`;
        if (!command.execute)
        {
            throw new InvalidCommand(
                file, `${EXECUTE_MESSAGE_PREFIX} is missing.`
            );
        }
        if (typeof command.execute != "function")
        {
            throw new InvalidCommand(
                file, `${EXECUTE_MESSAGE_PREFIX} must be a function.`
            );
        }  
        
        // validate options if provided
        if (command.options)
        {
            if (!Array.isArray(command.options))
            {
                throw new InvalidCommand(
                    file, 
                    `The command '${command.name}' has options defined, ` +
                    `but it is not an array.`
                );
            }
            if (command.options.length > 25)
            {
                throw new InvalidCommand(
                    file, 
                    `The command '${command.name}' has too many options. `+
                    `There can be at most 25 options.`
                );
            }
            let optionNames: string[] = [];
            for (const OPTION of command.options)
            {
                // validate option name
                validateName(
                    OPTION.name, 
                    `The option name '${OPTION.name}' on command '${command.name}'`
                );
                if (optionNames.indexOf(OPTION.name)>=0)
                {
                    throw new InvalidCommand(
                        file, 
                        `The command '${command.name}' has multiple options of ` +
                        `the same name '${OPTION.name}'.`
                    );
                }
                optionNames.push(OPTION.name);

                // validate option description
                validateDescription(
                    OPTION.description,
                    `The description '${OPTION.description}' on command ` +
                    `'${command.name}' option '${OPTION.name}'`
                );

                // validate type if provided
                if (OPTION.type != undefined && 
                    OPTION.type != null && 
                    ["string", "number"].indexOf(OPTION.type)<0
                ) {
                    throw new InvalidCommand(
                        file, 
                        `The type '${OPTION.type}' on command '${command.name}' ` +
                        `option '${OPTION.name}' is defined, but it is neither ` +
                        `'string' nor 'number'.`
                    );
                }
            }

        }

        function validateName(name: string, descriptor: string): void
        {
            validateNonEmptyStringAndNotTooLong(name, descriptor, 32);
            if (name.indexOf(" ") >= 0)
            {
                throw new InvalidCommand(
                    file, `${descriptor} has spaces. ${COMMAND_NAME_FORMAT}`
                );
            }
            if (name.toLowerCase() != name)
            {
                throw new InvalidCommand(
                    file, `${descriptor} has uppercase letters. ${COMMAND_NAME_FORMAT}`
                )
            }
            if (!name.match(/^[\w-]{1,32}$/))
            {
                throw new InvalidCommand(
                    file, `${descriptor} has invalid characters. ${COMMAND_NAME_FORMAT}`
                )
            }
        }

        function validateDescription(description: string, descriptor: string): void
        {
            validateNonEmptyStringAndNotTooLong(description, descriptor, 100);
        }

        function validateNonEmptyStringAndNotTooLong(
            value: string, descriptor: string, max: number): void
        {
            if (!value)
            {
                throw new InvalidCommand(file, `${descriptor} is missing or empty.`);
            }
            if (typeof value != "string")
            {
                throw new InvalidCommand(file, `${descriptor} must be a string.`);
            }
            if (value.length > max)
            {
                throw new InvalidCommand(
                    file, 
                    `${descriptor} is too long. ` +
                    `It can only have up to ${max} characters.`
                );
            }
        }

    }

}