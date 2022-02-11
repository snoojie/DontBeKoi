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
import EnhancedError from "./util/enhancedError";

export class CommandManagerError extends EnhancedError {}

export class InvalidCommand extends CommandManagerError
{
    constructor(file: string, reason: string)
    {
        super(`${file} is not a valid command script. ` + reason);
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
     * @throws CommandManagerError if the commands directory is missing
     * @throws InvalidCommand if a command script does not have a valid command
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

            // validate the name
            if (!command.name)
            {
                throw new InvalidCommand(FILE, "The name property is missing or empty.");
            }
            if (command.name.indexOf(" ") >= 0)
            {
                throw new InvalidCommand(FILE, "A command's name cannot have spaces.");
            }
            if (this.commands.has(command.name))
            {
                throw new InvalidCommand(
                    FILE, 
                    `There exists multiple commands with the same name ${command.name}.`
                );
            }

            // validate the description
            if (!command.description)
            {
                throw new InvalidCommand(
                    FILE, "The description property is missing or empty."
                );
            }

            // validate the execute function
            if (!command.execute)
            {
                throw new InvalidCommand(FILE, "The execute property is missing.")
            }
            if (typeof command.execute != "function")
            {
                throw new InvalidCommand(
                    FILE, "The execute property must be a function."
                );
            }

            // if options was not set, set it to the empty list
            if (!command.options)
            {
                command.options = [];
            }

            // save the command is valid!
            this.commands.set(command.name, command);
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
                        // TODO, pull the option.set... methods into a common function
                        if (OPTION.type == "number")
                        {
                            commandBuilder.addNumberOption(option => 
                                option.setName(OPTION.name)
                                    .setDescription(OPTION.description)
                                    .setRequired(true)
                            );
                        }
                        else // string
                        {
                            commandBuilder.addStringOption(option => 
                                option.setName(OPTION.name)
                                    .setDescription(OPTION.description)
                                    .setRequired(true)
                            );
                        }
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
}