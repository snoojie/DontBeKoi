const { CommandManager, InvalidCommand, CommandManagerError, CommandExecutionError } 
    = require("../src/command");
const { ConfigError } = require("../src/util/config");
const fs = require("fs");
const { REST } = require("@discordjs/rest");

let commandManager;
const ORIGINAL_FS_EXISTSSYNC = fs.existsSync;
const ORIGINAL_FS_READDIRSYNC = fs.readdirSync;

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
    let run = commandManager.run();
    await expect(run).rejects.toThrow(CommandManagerError);
    await expect(run).rejects.toThrow("commands directory is missing");
});

describe("Validate command scripts.", () => {

    // =======================
    // =====NAME PROPERTY=====
    // =======================

    test("Missing name property.", async() => {
        mockCommandDirectory("nameMissing");
        let run = commandManager.run();
        await expectInvalidCommand(run, `The command name 'undefined' is missing`);
    });
    
    test("Name is not a string.", async() => {
        mockCommandDirectory("nameNotString");
        let run = commandManager.run();
        await expectInvalidCommand(run, "The command name '3' must be a string");
    });

    test("Name with spaces.", async() => {
        mockCommandDirectory("nameWithSpaces");
        let run = commandManager.run();
        await expectInvalidCommand(
            run, "The command name 'name with spaces' has spaces"
        );
    });

    test("Long name.", async() => {
        mockCommandDirectory("nameTooLong");
        let run = commandManager.run();
        await expectInvalidCommand(
            run, 
            "The command name 'namethatisverylongjusttoolongwaytoolong' is too long"
        );
    });

    test("Name with capitals.", async() => {
        mockCommandDirectory("nameWithCapitals");
        let run = commandManager.run();
        await expectInvalidCommand(
            run, "The command name 'SomeName' has uppercase letters"
        );
    });

    test("Name with a period.", async() => {
        mockCommandDirectory("nameWithPeriod");
        let run = commandManager.run();
        await expectInvalidCommand(
            run, "The command name 'some.name' has invalid characters"
        );
    });

    // ==============================
    // =====DESCRIPTION PROPERTY=====
    // ==============================

    test("Missing description property.", async() => {
        mockCommandDirectory("descriptionMissing");
        let run = commandManager.run();
        await expectInvalidCommand(
            run, "The description 'undefined' on command 'somename' is missing"
        );
    });

    test("Description is not a string.", async() => {
        mockCommandDirectory("descriptionNotString");
        let run = commandManager.run();
        await expectInvalidCommand(
            run, "The description '3' on command 'somename' must be a string"
        );
    });

    test("Long description.", async() => {
        mockCommandDirectory("descriptionTooLong");
        let run = commandManager.run();
        await expectInvalidCommand(
            run, 
            "The description " +
                "'here is a description. it is very long. why so long? why not. " +
                "this is a test. it can be whatever. it just needs to be long.' " +
            "on command 'somename' is too long"
        );
    });

    // ==========================
    // =====EXECUTE PROPERTY=====
    // ==========================

    test("Missing execute property.", async() => {
        mockCommandDirectory("executeMissing");
        let run = commandManager.run();
        await expectInvalidCommand(
            run, "The execute property on command 'somename' is missing"
        );
    });

    test("Execute property not a function.", async() => {
        mockCommandDirectory("executeNotFunction");
        let run = commandManager.run();
        await expectInvalidCommand(
            run, "The execute property on command 'somename' must be a function"
        );
    });

    // ==========================
    // =====OPTIONS PROPERTY=====
    // ==========================

    test("Options is not an array.", async() => {
        mockCommandDirectory("optionsNotArray");
        let run = commandManager.run();
        await expectInvalidCommand(
            run, 
            "The command 'somename' has options defined, but it is not an array"
        );
    });

    test("Too many options.", async() => {
        mockCommandDirectory("optionsTooMany");
        let run = commandManager.run();
        await expectInvalidCommand(
            run, 
            "The command 'somename' has too many options"
        );
    });

    test("Duplicate option names.", async() => {
        mockCommandDirectory("optionsDuplicateNames");
        let run = commandManager.run();
        await expectInvalidCommand(
            run, 
            "The command 'somename' has multiple options " +
            "of the same name 'someoption'"
        );
    });

    // ===============================
    // =====OPTIONS NAME PROPERTY=====
    // ===============================

    test("Option missing name.", async() => {
        mockCommandDirectory("optionNameMissing");
        let run = commandManager.run();
        await expectInvalidCommand(
            run, `The option name 'undefined' on command 'somename' is missing`
        );
    });
    
    test("Option name is not a string.", async() => {
        mockCommandDirectory("optionNameNotString");
        let run = commandManager.run();
        await expectInvalidCommand(
            run, "The option name '5' on command 'somename' must be a string"
        );
    });

    test("Option name with spaces.", async() => {
        mockCommandDirectory("optionNameWithSpaces");
        let run = commandManager.run();
        await expectInvalidCommand(
            run, 
            "The option name 'some option name' on command 'somename' has spaces"
        );
    });

    test("Option long name.", async() => {
        mockCommandDirectory("optionNameTooLong");
        let run = commandManager.run();
        await expectInvalidCommand(
            run, 
            "The option name 'namethatisverylongjusttoolongwaytoolong' " +
            "on command 'somename' is too long"
        );
    });

    test("Option name with capitals.", async() => {
        mockCommandDirectory("optionNameWithCapitals");
        let run = commandManager.run();
        await expectInvalidCommand(
            run, 
            "The option name 'someOptionName' on " +
            "command 'somename' has uppercase letters"
        );
    });

    test("Option name with pound sign.", async() => {
        mockCommandDirectory("optionNameWithPound");
        let run = commandManager.run();
        await expectInvalidCommand(
            run, 
            "The option name 'some#optionname' on " +
            "command 'somename' has invalid characters"
        );
    });

    // =====================================
    // =====OPTION DESCRIPTION PROPERTY=====
    // =====================================

    test("Option missing description property.", async() => {
        mockCommandDirectory("optionDescriptionMissing");
        let run = commandManager.run();
        await expectInvalidCommand(
            run, 
            "The description 'undefined' on command 'somename' " +
            "option 'someoptionname' is missing"
        );
    });

    test("Option description is not a string.", async() => {
        mockCommandDirectory("optionDescriptionNotString");
        let run = commandManager.run();
        await expectInvalidCommand(
            run, 
            "The description '6' on command 'somename' " +
            "option 'someoptionname' must be a string"
        );
    });

    test("Option long description.", async() => {
        mockCommandDirectory("optionDescriptionTooLong");
        let run = commandManager.run();
        await expectInvalidCommand(
            run, 
            "The description " +
                "'here is a description. it is very long. why so long? why not. " +
                "this is a test. it can be whatever. it just needs to be long.' " +
            "on command 'somename' option 'someoptionname' is too long"
        );
    });

    // ==============================
    // =====OPTION TYPE PROPERTY=====
    // ==============================

    test("Option type is an empty string.", async() => {
        mockCommandDirectory("optionTypeEmpty");
        let run = commandManager.run();
        await expectInvalidCommand(
            run, 
            "The type '' on command 'somename' option 'someoptionname' is " +
            "defined, but it is neither 'string' nor 'number'"
        );
    });

    test("Option type is not a string.", async() => {
        mockCommandDirectory("optionTypeNotString");
        let run = commandManager.run();
        await expectInvalidCommand(
            run, 
            "The type '1' on command 'somename' option 'someoptionname' is " +
            "defined, but it is neither 'string' nor 'number'"
        );
    });
    
    test("Option type is unknown.", async() => {
        mockCommandDirectory("optionTypeUnknown");
        let run = commandManager.run();
        await expectInvalidCommand(
            run, 
            "The type 'unknowntype' on command 'somename' option " +
            "'someoptionname' is defined, but it is neither 'string' nor 'number'"
        );
    });

    // =============================
    // =====IS PRIVATE PROPERTY=====
    // =============================

    test("Is Private is not a boolean.", async() => {
        mockCommandDirectory("isPrivateNotBoolean");
        let run = commandManager.run();
        await expectInvalidCommand(
            run, 
            "Property isPrivate on command 'somename' is defined, " +
            "but it is neither 'true' nor 'false'"
        );
    });

    // ==========================
    // =====HELPER FUNCTIONS=====
    // ==========================

    async function expectInvalidCommand(run, message)
    {
        await expect(run).rejects.toThrow(InvalidCommand);
        await expect(run).rejects.toThrow(message);
    }
    
});

describe("Test parameters to REST call to discord.", () => {
    
    const ORIGINAL_REST_PUT = REST.put;
    beforeEach(() => REST.prototype.put = jest.fn(async () => {}));
    afterEach(() => REST.prototype.put = ORIGINAL_REST_PUT);

    test("CommandManagerError when REST call to deploy to discord fails.", async() => {
        REST.prototype.put = jest.fn(async () => 
            { throw new Error("mock rest error"); }
        );
        let run = commandManager.run();
        await expect(run).rejects.toThrow(CommandManagerError);
        await expect(run).rejects.toThrow("Failed to deploy commands to discord");
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

function mockCommandDirectory(...commandScripts)
{
    const DIRECTORY = "../../tests/_mocks/commands";
    let files = [];
    for (const SCRIPT of commandScripts)
    {
        files.push(`${DIRECTORY}/${SCRIPT}.js`);
    }
    fs.readdirSync = jest.fn(() => files);
}

// =========================
// =====EXECUTE COMMAND=====
// =========================

// todo: add tests for execute public error vs other error

describe("Mocking interaction.", () => {

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
            execute, "Cannot execute a command for a non command interaction"
        );
    });

    test("Unknown command name.", async() => {
        interaction.commandName = "unknowncommand";
        let execute = commandManager.executeCommand(interaction);
        await expectCommandExecutionError(
            execute, "Did not recognize the command name 'unknowncommand'"
        );
    });

    test("Response of command's execute sent to discord as a reply.", async() => {
        
        commandManager.commands.set(command.name, command);
        interaction.editReply = jest.fn(async () => {});

        await commandManager.executeCommand(interaction);
        expect(interaction.editReply.mock.calls.length).toBe(1);
        expect(interaction.editReply.mock.calls[0][0]).toBe(COMMAND_RESPONSE);
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

    

    async function expectCommandExecutionError(execute, message)
    {
        await expect(execute).rejects.toThrow(CommandExecutionError);
        await expect(execute).rejects.toThrow(message);
    }
});







