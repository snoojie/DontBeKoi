import { CommandInteraction, Interaction } from "discord.js";
import { SlashCommandBuilder, SlashCommandStringOption, SlashCommandNumberOption } 
    from "@discordjs/builders";
import { REST } from "@discordjs/rest"
import { Routes } from "discord-api-types/v9";
import Logger from "./util/logger";
import { Config } from "./util/config";
import * as fs from "fs";
import EnhancedError from "./util/enhancedError";

/**
 * Base error that is thrown.
 */
export class CommandManagerError extends EnhancedError {}

/**
 * Error thrown when a command in the commands/ directory is not programmed correctly.
 */
export class InvalidCommand extends CommandManagerError
{
    constructor(file: string, reason: string)
    {
        super(`${file} is not a valid command script. ` + reason);
    }
}

/**
 * Error thrown when slash commands could not be deployed to discord.
 */
export class DeployCommandsError extends CommandManagerError
{
    constructor(error: any)
    {
        super("Failed to deploy commands to discord.", error);
    }
}

/**
 * Error thrown when a slash command could not be executed.
 * This error should never happen. If it does, something is very, very wrong.
 */
export class CommandExecutionError extends CommandManagerError {}

/**
 * An option of a discord slash command.
 */
export interface Option
{
    /**
     * Name of the slash command option. For example, consider '/google spreadsheet'. 
     * The option name is 'spreadsheet'
     * 
     * The name can have up to 32 characters and consist only of
     * lowercase letters, numbers, underscores, and dashes.
     */
    name: string;

    /**
     * Description of the slash command option.
     * This will appear in discord as people view the slash command option.
     * 
     * Description can have up to 100 characters.
     */
    description: string;
    
    /**
     * The type of value the discord user can enter for this slash command option.
     * For example, if type is 'number', then the discord user must provide a number.
     * If this property is not set, the type will default to 'string'.
     */
    type?: "string" | "number";
}

/**
 * A discord slash command.
 */
export interface Command
{

    /**
     * Name of the slash command. 
     * For example, if name is 'google', then in discord you can do '/google'
     * 
     * The name can have up to 32 characters and consist only of
     * lowercase letters, numbers, underscores, and dashes.
     */
    name: string;

    /**
     * Description of the slash command.
     * This will appear in discord as people view the slash command.
     * 
     * Description can have up to 100 characters.
     */
    description: string;

    /**
     * Method that is called when a discord user enters the slash command.
     * The string that this method returns is what the bot responds with in discord.
     */
    execute: (interaction: CommandInteraction) => Promise<string>;

    /**
     * Options of the slash command. For example, consider the google command
     * '/google spreadsheet:', here 'spreadsheet' is an option and would be defined as
     * [ { name: "spreadsheet", description: "ID of your google spreadsheet" } ]
     * 
     * There can only be up to 25 options.
     */
    options?: Option[];

    /**
     * Whether the bot responds privately or not to the discord user that 
     * executed this command. If this property is not set, then by default, the reply
     * will be public.
     */
    isPrivate?: boolean;
}

type CommandCollection = Map<string, Command>;

/**
 * Manages discord slash commands.
 * 
 * Call run() to deploy slash commands to discord.
 * 
 * Call executeCommand() to execute a specific command given an interaction in discord.
 */
export class CommandManager
{
    private commands: CommandCollection;

    constructor()
    {
        this.commands = new Map();
    }

    /**
     * Deploys commands from commands/ directory to the discord server.
     * @throws CommandManager if commands could not be deployed to discord.
     * @throws InvalidCommand if any command script is invalid.
     */
    public async run(): Promise<void>
    {
        await this.loadCommandScripts();
        await this.deploy();
    }

    /**
     * Executes the command defined by the interaction.
     * @param interaction Interaction the command took place in.
     * @throws CommandExecutionError if the interaction is not a command interaction.
     */
    public async executeCommand(interaction: Interaction): Promise<void>
    {
        // ignore non commands
        // though this shouldn't happen
        if (!interaction.isCommand())
        {
            throw new CommandExecutionError(
                "Cannot execute a command for a non command interaction."
            );
        }

        // get the command
        const COMMAND: Command | undefined = this.commands.get(interaction.commandName);
        if (!COMMAND)
        {
            // this shouldn't happen
            throw new CommandExecutionError(
                `Did not recognize the command name '${interaction.commandName}'.`
            );
        }

        // defer the reply
        await interaction.deferReply({
            ephemeral: COMMAND.isPrivate
        });

        // get information about this command to log it, ex:
        // Snooj: /who color:nedai pattern:sakyu
        let commandInfo: string = 
            `${interaction.user.username}: /${interaction.commandName}`;
        if (COMMAND.options)
        {
            for (const OPTION of COMMAND.options)
            {
                const VALUE: string = "" + (OPTION.type == "number" 
                    ? interaction.options.getNumber(OPTION.name)
                    : interaction.options.getString(OPTION.name));
                    commandInfo += ` ${OPTION.name}:${VALUE}`;
            }
        }

        // log the command, ex:
        // Starting... Snooj: /who color:nedai pattern:sakyu
        Logger.log(`Starting... ${commandInfo}`);

        // time how long this command takes
        const START_TIME: number = getCurrentTimestamp();

        // execute the command
        const REPLY: string = await COMMAND.execute(interaction)
            .catch(error => {
                Logger.error("Uncaught error when executing command.");
                Logger.error(error);
                Logger.error(interaction);
                return "Uh oh. Something went wrong.";
            });
        
        // since the command is done, we can see how long it took
        const DURATION: number = getCurrentTimestamp() - START_TIME;
        const DURATION_MESSAGE: string = DURATION < 1000
            ? DURATION + " ms"
            : DURATION/1000 + " s";
        
        // log the results of this command including how long it took to run, ex:
        // Finished... Snooj: /who color:nedai pattern:sakyu ...349 ms
        //     Needing common 10h nedai sakyu:
        //     <@669702480833019954>
        Logger.log(
            `Finished... ${commandInfo} `+
            `...${DURATION_MESSAGE}` +
            `${("\n"+REPLY).split("\n").join("\n    ")}`
        );

        // reply 
        // note if we are logged into two places, this will throw
        // DiscordAPIError: Unknown interaction
        await interaction.editReply(REPLY)
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
            if (typeof command != "object")
            {
                throw new InvalidCommand(
                    FILE, 
                    `Expected default export to be of type object. ` +
                    `Instead, it is of type '${typeof command}'.`
                );
            }
            if (Object.keys(command).length == 0)
            {
                throw new InvalidCommand(
                    FILE, "Default export is empty. Was nothing exported?"
                );
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

            // save the command
            this.commands.set(command.name, command);
        }
    }

    /**
     * Deploys commands to the discord server.
     * @throws ConfigError if environment variables were not set.
     * @throws CommandManager if failed to deploy commands to discord.
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
                throw new DeployCommandsError(error);
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

        // validate isPrivate if provided
        if (command.isPrivate != undefined && typeof command.isPrivate != "boolean")
        {
            throw new InvalidCommand(
                file, 
                `Property isPrivate on command '${command.name}' is defined, ` +
                `but it is neither 'true' nor 'false'.`
            );
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

/**
 * Helper function to get the current timestamp.
 */
function getCurrentTimestamp(): number
{
    return new Date().getTime();
}