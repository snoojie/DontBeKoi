const { CommandManager, InvalidCommand, CommandsNotFound, CommandExecutionError, 
        DeployCommandsError } = require("../src/command");
const { ConfigError } = require("../src/util/config");
const fs = require("fs");
const { REST } = require("@discordjs/rest");
const { expectErrorAsync } = require("./_setup/testUtil");
const { default: Logger } = require("../src/util/logger");

let commandManager;
const ORIGINAL_FS_EXISTSSYNC = fs.existsSync;
const ORIGINAL_FS_READDIRSYNC = fs.readdirSync;
const MOCK_COMMANDS_DIRECTORY = "../../tests/_mocks/commands";

beforeEach(() => commandManager = new CommandManager());
afterEach(() => {
    fs.existsSync = ORIGINAL_FS_EXISTSSYNC;
    fs.readdirSync = ORIGINAL_FS_READDIRSYNC;
});

// =============
// =====RUN=====
// =============

test("No error deploying commands to discord server.", async () => {
    await commandManager.run();
});
    
test("Missing commands/ directory.", async() => {
    fs.existsSync = jest.fn(() => false);
    await expectErrorAsync(
        commandManager.run(),
        CommandsNotFound,
        "The commands directory is missing."
    );
});

describe("Validate command scripts.", () => {

    // ================
    // =====EXPORT=====
    // ================

    test("Command script is empty.", async() => {
        await testInvalidCommand(
            "emptyFile", "Default export is empty. Was nothing exported?"
        );
    });

    test("Command script not empty but nothing was exported.", async() => {
        await testInvalidCommand(
            "exportNothing", "Default export is empty. Was nothing exported?"
        );
    });

    test("Number exported.", async() => {
        await testInvalidCommand(
            "exportNumber",
            "Expected default export to be of type object. " +
            "Instead, it is of type 'number'."
        );
    });

    test("Multiple exports.", async() => {
        await testInvalidCommand("exportMany", "Missing a default export.");
    });

    // =======================
    // =====NAME PROPERTY=====
    // =======================

    test("Missing name property.", async() => {
        await testInvalidCommand(
            "nameMissing", "The command name 'undefined' is missing or empty.");
    });
    
    test("Name is not a string.", async() => {
        await testInvalidCommand("nameNotString", "The command name '3' must be a string.");
    });

    test("Name with spaces.", async() => {
        await testInvalidCommand(
            "nameWithSpaces", 
            "The command name 'name with spaces' has spaces. " + 
            "Use lowercase letters, numbers, underscores, and dashes only."
        );
    });

    test("Long name.", async() => {
        await testInvalidCommand(
            "nameTooLong", 
            "The command name 'namethatisverylongjusttoolongwaytoolong' is too long. " +
            "It can only have up to 32 characters."
        );
    });

    test("Name with capitals.", async() => {
        await testInvalidCommand(
            "nameWithCapitals", 
            "The command name 'SomeName' has uppercase letters. " +
            "Use lowercase letters, numbers, underscores, and dashes only."
        );
    });

    test("Name with a period.", async() => {
        await testInvalidCommand(
            "nameWithPeriod", 
            "The command name 'some.name' has invalid characters. " +
            "Use lowercase letters, numbers, underscores, and dashes only."
        );
    });

    test("Two commands with the same name.", async() => {
        mockCommandDirectory("valid", "validDuplicate");
        await expectInvalidCommand(
            commandManager.run(), 
            "validDuplicate",
            "There exists multiple commands with the same name 'validcommand'."
        );
    });

    // ==============================
    // =====DESCRIPTION PROPERTY=====
    // ==============================

    test("Missing description property.", async() => {
        await testInvalidCommand(
            "descriptionMissing",
            "The description 'undefined' on command 'somename' is missing or empty."
        );
    });

    test("Description is not a string.", async() => {
        await testInvalidCommand(
            "descriptionNotString",
            "The description '3' on command 'somename' must be a string."
        );
    });

    test("Long description.", async() => {
        await testInvalidCommand(
            "descriptionTooLong",
            "The description " +
                "'here is a description. it is very long. why so long? why not. " +
                "this is a test. it can be whatever. it just needs to be long.' " +
            "on command 'somename' is too long. " +
            "It can only have up to 100 characters."
        );
    });

    // ==========================
    // =====EXECUTE PROPERTY=====
    // ==========================

    test("Missing execute property.", async() => {
        await testInvalidCommand(
            "executeMissing", 
            "The execute property on command 'somename' is missing."
        );
    });

    test("Execute property not a function.", async() => {
        await testInvalidCommand(
            "executeNotFunction", 
            "The execute property on command 'somename' must be a function."
        );
    });

    // ==========================
    // =====OPTIONS PROPERTY=====
    // ==========================

    test("Options is not an array.", async() => {
        await testInvalidCommand(
            "optionsNotArray",
            "The command 'somename' has options defined, but it is not an array."
        );
    });

    test("Too many options.", async() => {
        await testInvalidCommand(
            "optionsTooMany", 
            "The command 'somename' has too many options. There can be at most 25 options."
        );
    });

    test("Duplicate option names.", async() => {
        await testInvalidCommand(
            "optionsDuplicateNames",
            "The command 'somename' has multiple options of the same name 'someoption'."
        );
    });

    // ===============================
    // =====OPTIONS NAME PROPERTY=====
    // ===============================

    test("Option missing name.", async() => {
        await testInvalidCommand(
            "optionNameMissing",
            "The option name 'undefined' on command 'somename' is missing or empty."
        );
    });
    
    test("Option name is not a string.", async() => {
        await testInvalidCommand(
            "optionNameNotString", 
            "The option name '5' on command 'somename' must be a string."
        );
    });

    test("Option name with spaces.", async() => {
        await testInvalidCommand(
            "optionNameWithSpaces",
            "The option name 'some option name' on command 'somename' has spaces. " +
            "Use lowercase letters, numbers, underscores, and dashes only."
        );
    });

    test("Option long name.", async() => {
        await testInvalidCommand(
            "optionNameTooLong",
            "The option name 'namethatisverylongjusttoolongwaytoolong' " +
            "on command 'somename' is too long. " +
            "It can only have up to 32 characters."
        );
    });

    test("Option name with capitals.", async() => {
        await testInvalidCommand(
            "optionNameWithCapitals",
            "The option name 'someOptionName' on command 'somename' has uppercase " +
            "letters. Use lowercase letters, numbers, underscores, and dashes only."
        );
    });

    test("Option name with pound sign.", async() => {
        await testInvalidCommand(
            "optionNameWithPound",
            "The option name 'some#optionname' on command 'somename' has invalid " +
            "characters. Use lowercase letters, numbers, underscores, and dashes only."
        );
    });

    // =====================================
    // =====OPTION DESCRIPTION PROPERTY=====
    // =====================================

    test("Option missing description property.", async() => {
        await testInvalidCommand(
            "optionDescriptionMissing",
            "The description 'undefined' on command 'somename' " +
            "option 'someoptionname' is missing or empty."
        );
    });

    test("Option description is not a string.", async() => {
        await testInvalidCommand(
            "optionDescriptionNotString",
            "The description '6' on command 'somename' " +
            "option 'someoptionname' must be a string."
        );
    });

    test("Option long description.", async() => {
        await testInvalidCommand(
            "optionDescriptionTooLong",
            "The description " +
                "'here is a description. it is very long. why so long? why not. " +
                "this is a test. it can be whatever. it just needs to be long.' " +
            "on command 'somename' option 'someoptionname' is too long. " +
            "It can only have up to 100 characters."
        );
    });

    // ==============================
    // =====OPTION TYPE PROPERTY=====
    // ==============================

    test("Option type is an empty string.", async() => {
        await testInvalidCommand(
            "optionTypeEmpty",
            "The type '' on command 'somename' option 'someoptionname' is " +
            "defined, but it is neither 'string' nor 'number'."
        );
    });

    test("Option type is not a string.", async() => {
        await testInvalidCommand(
            "optionTypeNotString",
            "The type '1' on command 'somename' option 'someoptionname' is " +
            "defined, but it is neither 'string' nor 'number'."
        );
    });
    
    test("Option type is unknown.", async() => {
        await testInvalidCommand(
            "optionTypeUnknown",
            "The type 'unknowntype' on command 'somename' option " +
            "'someoptionname' is defined, but it is neither 'string' nor 'number'."
        );
    });

    // =============================
    // =====IS PRIVATE PROPERTY=====
    // =============================

    test("Is Private is not a boolean.", async() => {
        await testInvalidCommand(
            "isPrivateNotBoolean",
            "Property isPrivate on command 'somename' is defined, " +
            "but it is neither 'true' nor 'false'."
        );
    });
    
    async function testInvalidCommand(file, errorMessage)
    {
        mockCommandDirectory(file);
        await expectInvalidCommand(
            commandManager.run(), 
            file,
            errorMessage
        );
    }

    async function expectInvalidCommand(run, file, errorMessage)
    {
        await expectErrorAsync(
            run, 
            InvalidCommand, 
            `../../tests/_mocks/commands/${file}.js is not a valid command script. ` +
            errorMessage
        );
    }
    
});

describe("Test parameters to REST call to discord.", () => {
    
    const ORIGINAL_REST_PUT = REST.prototype.put;
    beforeEach(() => REST.prototype.put = jest.fn(async () => {}));
    afterEach(() => REST.prototype.put = ORIGINAL_REST_PUT);

    test("stuff", () => expect(3).toBe(3));

    test("Error when REST call to deploy to discord fails.", async() => {
        REST.prototype.put = jest.fn(async () => 
            { throw new Error("mock rest error"); }
        );
        await expectErrorAsync(
            commandManager.run(),
            DeployCommandsError,
            "Failed to deploy commands to discord."
        );
    });

    test("Command properties sent to discord.", async() => {
        mockCommandDirectory("valid");
        await commandManager.run();
        let mockCalls = REST.prototype.put.mock.calls;
        expect(mockCalls.length).toBe(1);

        let commandList = mockCalls[0][1].body;
        expect(commandList.length).toBe(1);

        let command = commandList[0];
        expect(command.name).toBe("validcommand");
        expect(command.description).toBe("This command is valid.");
        expect(command.options.length).toBe(0);
    });

    test(
        "Can attach string option to command without specifying type.", 
        async() =>
    {
        mockCommandDirectory("validStringOption");
        await commandManager.run();
        let mockCalls = REST.prototype.put.mock.calls;
        expect(mockCalls.length).toBe(1);

        let commandList = mockCalls[0][1].body;
        expect(commandList.length).toBe(1);

        let command = commandList[0];
        expect(command.name).toBe("stringcommand");
        expect(command.description)
            .toBe("This command has a string option.");

        let optionList = command.options;
        expect(optionList.length).toBe(1);

        let option = optionList[0];
        expect(option.name).toBe("stringoption");
        expect(option.description).toBe("option with string value");
        expect(option.type).toBe(3); // type 3 is string
        expect(option.required).toBeTruthy();
    });

    test("Can attach string option to command with specifying type.", async() => {
        mockCommandDirectory("validStringOptionType");
        await commandManager.run();
        let mockCalls = REST.prototype.put.mock.calls;
        expect(mockCalls.length).toBe(1);

        let commandList = mockCalls[0][1].body;
        expect(commandList.length).toBe(1);

        let command = commandList[0];
        expect(command.name).toBe("stringcommandwithtype");
        expect(command.description)
            .toBe("This command has a string option and defined type.");

        let optionList = command.options;
        expect(optionList.length).toBe(1);

        let option = optionList[0];
        expect(option.name).toBe("stringoption");
        expect(option.description).toBe("option with string value");
        expect(option.type).toBe(3); // type 3 is string
        expect(option.required).toBeTruthy();
    });

    test("Can attach number option to command.", async() => {
        mockCommandDirectory("validNumberOption");
        await commandManager.run();
        let mockCalls = REST.prototype.put.mock.calls;
        expect(mockCalls.length).toBe(1);

        let commandList = mockCalls[0][1].body;
        expect(commandList.length).toBe(1);

        let command = commandList[0];
        expect(command.name).toBe("numbercommand");
        expect(command.description).toBe("This command has a number option.");

        let optionList = command.options;
        expect(optionList.length).toBe(1);

        let option = optionList[0];
        expect(option.name).toBe("numberoption");
        expect(option.description).toBe("option with number value");
        expect(option.type).toBe(10); // type 10 is number
        expect(option.required).toBeTruthy();
    });

    test("Properties of several commands sent to discord.", async() => {
        mockCommandDirectory("valid", "validStringOption");
        await commandManager.run();
        let mockCalls = REST.prototype.put.mock.calls;
        expect(mockCalls.length).toBe(1);

        let commandList = mockCalls[0][1].body;
        expect(commandList.length).toBe(2);

        let basicCommand = commandList[0];
        expect(basicCommand.name).toBe("validcommand");
        expect(basicCommand.description).toBe("This command is valid.");
        expect(basicCommand.options.length).toBe(0);

        let optionCommand = commandList[1];
        expect(optionCommand.name).toBe("stringcommand");
        expect(optionCommand.description).toBe("This command has a string option.")
        expect(optionCommand.options.length).toBe(1);
    });
});

describe("Missing environment variables", () => {

    const ORIGINAL_ENV = process.env;

    beforeEach(() => process.env = { ...ORIGINAL_ENV });
    afterAll(() => process.env = { ...ORIGINAL_ENV });

    testMissingEnvironmentVariable("BOT_TOKEN");
    testMissingEnvironmentVariable("CLIENT_ID");
    testMissingEnvironmentVariable("GUILD_ID");

    function testMissingEnvironmentVariable(envKey)
    {
        const READABLE_ENV_KEY = envKey.toLowerCase().replace("_", " ");
        test(`Error deploying commands without a ${READABLE_ENV_KEY}.`, async () => {
            delete process.env[envKey];
            await expect(commandManager.run()).rejects.toThrow(ConfigError);
        });
    }
});

test("Skip .txt and .js.map files in commands/", async() => {
    fs.readdirSync = jest.fn(() => [
        `${MOCK_COMMANDS_DIRECTORY}/notACommand.txt`,
        `${MOCK_COMMANDS_DIRECTORY}/notACommand.js.map`
    ]);

    // confirm there is no error running this
    await commandManager.run();

    // peak into commandManager. There shouldn't be any commands
    expect(commandManager.commands.size).toBe(0);
});

function mockCommandDirectory(...commandScripts)
{
    let files = [];
    for (const SCRIPT of commandScripts)
    {
        files.push(`${MOCK_COMMANDS_DIRECTORY}/${SCRIPT}.js`);
    }
    fs.readdirSync = jest.fn(() => files);
}

// =========================
// =====EXECUTE COMMAND=====
// =========================

describe("Test execute method.", () => {

    const COMMAND_RESPONSE = "some response";
    let command;   
    let interaction;
    beforeEach(() => {

        command = {
            name: "somecommand",
            description: "some description",
            execute: async() => COMMAND_RESPONSE
        };

        interaction = { 
            isCommand: () => true,
            commandName: command.name,
            user: { username: "someuser" },
            deferReply: async() => {}, 
            editReply: async() => {}
        };

    });

    test("Interaction not a command interaction.", async() => {
        interaction.isCommand = () => false;
        let execute = commandManager.executeCommand(interaction);
        await expectCommandExecutionError(
            execute, "Cannot execute a command for a non command interaction."
        );
    });

    test("Unknown command name.", async() => {
        interaction.commandName = "unknowncommand";
        let execute = commandManager.executeCommand(interaction);
        await expectCommandExecutionError(
            execute, "Did not recognize the command name 'unknowncommand'."
        );
    });

    // ====================
    // =====IS PRIVATE=====
    // ====================

    describe(
        "Command property isPrivate affects whether bot responses are private.", () => 
    {

        testIsPrivate(
            "Setting command property isPrivate to true makes response private.",
            true);

        testIsPrivate(
            "Setting command property isPrivate to false makes response public.",
            false
        );
            
        testIsPrivate(
            "Not setting command property isPrivate makes response public."
        );

        function testIsPrivate(testName, isPrivate)
        {
            test(testName, async() => {
                command.isPrivate = isPrivate;
                commandManager.commands.set(command.name, command);
                interaction.deferReply = jest.fn(async () => {});
        
                await commandManager.executeCommand(interaction);

                expect(interaction.deferReply.mock.calls.length).toBe(1);

                if (isPrivate)
                {
                    expect(interaction.deferReply.mock.calls[0][0].ephemeral)
                        .toBeTruthy();
                }
                else
                {
                    expect(interaction.deferReply.mock.calls[0][0].ephemeral)
                        .toBeFalsy();
                }
            });
        }
    });

    // ==================
    // =====RESPONSE=====
    // ==================

    describe("Bot response to discord.", () => {

        test("Reply with command's execute result.", async() => {
            testBotResponse(COMMAND_RESPONSE);
        });
    
        test("Reply with general error message.", async() => {
            command.execute = async () => {
                throw new Error("mock private error message"); 
            }
            testBotResponse("Uh oh. Something went wrong.");
        });

        async function testBotResponse(response)
        {
            commandManager.commands.set(command.name, command);
            interaction.editReply = jest.fn(async () => {});
    
            await commandManager.executeCommand(interaction);
            expect(interaction.editReply.mock.calls.length).toBe(1);
            expect(interaction.editReply.mock.calls[0][0]).toBe(response);
        }

    });

    // =====================
    // =====LOG EXECUTE=====
    // =====================

    describe("Logging the command.", () => {

        const ORIGINAL_LOG = Logger.log;
        beforeEach(() => Logger.log = jest.fn());
        afterEach(() => Logger.log = ORIGINAL_LOG);

        test("Log a command.", async() => {
            commandManager.commands.set(command.name, command);
    
            await commandManager.executeCommand(interaction);

            expectCommandLogged("someuser: /somecommand");
        });

        test("Log a command with string option.", async() => {
            command.options = [ { 
                name: "someoption", description: "description for option" 
            } ];
            commandManager.commands.set(command.name, command);
            interaction.options = { getString: () => "some value" }
    
            await commandManager.executeCommand(interaction);

            expectCommandLogged("someuser: /somecommand someoption:some value");
        });

        test("Log a command with number option.", async() => {
            command.options = [ { 
                name: "someoption", description: "description for option", type: "number"
            } ];
            commandManager.commands.set(command.name, command);
            interaction.options = { getNumber: () => 3 }
    
            await commandManager.executeCommand(interaction);

            expectCommandLogged("someuser: /somecommand someoption:3");
        });

        test("Log a command with several options.", async() => {
            command.options = [ 
                { 
                    name: "firstoption", 
                    description: "description for option 1" 
                },
                { 
                    name: "secondoption", 
                    description: "description for option 2", 
                    type: "string"
                }
            ];
            commandManager.commands.set(command.name, command);
            interaction.options = { getString: (name) => `value for option ${name}` }
    
            await commandManager.executeCommand(interaction);

            expectCommandLogged(
                "someuser: /somecommand " +
                "firstoption:value for option firstoption " +
                "secondoption:value for option secondoption"
            );
        });
        
        test("Log a command that takes at least a second.", async() => {
            command.execute = async() => {
                await new Promise(resolve => setTimeout(resolve, 1100));
                return "some response";
            }
            commandManager.commands.set(command.name, command);
    
            await commandManager.executeCommand(interaction);

            expectCommandLogged("someuser: /somecommand", true);
        }, 1500);

        function expectCommandLogged(commandInfo, checkForSeconds)
        {
            expect(Logger.log.mock.calls.length).toBe(2);

            // first log
            expect(Logger.log.mock.calls[0][0]).toBe(`Starting... ${commandInfo}`);

            // second log message should be something like
            // Finished... someuser: /somecommand ...13 ms
            //     some response
            const SECOND_LOG = Logger.log.mock.calls[1][0];
            expect(SECOND_LOG.startsWith(`Finished... ${commandInfo} ...`)).toBeTruthy();
            expect(SECOND_LOG.endsWith("\n    some response")).toBeTruthy();

            // by default, we look for milliseconds
            let regex = /^\d+ ms$/;
            if (checkForSeconds)
            {
                regex = /^1(.\d{1,3})? s$/;
            }
            expect(SECOND_LOG.substring(
                commandInfo.length + 16, SECOND_LOG.indexOf("\n"))
            ).toMatch(regex);
        }
    });

    async function expectCommandExecutionError(execute, message)
    {
        await expectErrorAsync(execute, CommandExecutionError, message);
    }
});