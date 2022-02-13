const { CommandManager, InvalidCommand, CommandManagerError, CommandExecutionError } 
    = require("../src/command");
const { ConfigError } = require("../src/util/config");
const fs = require("fs");
const { REST } = require("@discordjs/rest");

test("Can create an instance of CommandManager.", () => {
    new CommandManager();
});

// =============
// =====RUN=====
// =============

describe("Testing run method", () => {

    let commandManager;
    beforeEach(() => commandManager = new CommandManager());

    test("Can deploy commands to discord server.", async () => {
        await commandManager.run();
    });

    describe("Missing commands/ directory.", () => {
    
        const ORIGINAL_FS_EXISTSSYNC = fs.existsSync;
        
        afterAll(() => fs.existsSync = ORIGINAL_FS_EXISTSSYNC);
    
        test("CommandManagerError when commands/ directory is missing.", async() => {
            fs.existsSync = jest.fn(() => false);
            let run = commandManager.run();
            await expect(run).rejects.toThrow(CommandManagerError);
            await expect(run).rejects.toThrow("commands directory is missing");
        });
    });

    describe("Validate command scripts.", () => {

        const ORIGINAL_FS_READDIRSYNC = fs.readdirSync;

        afterEach(() => fs.readdirSync = ORIGINAL_FS_READDIRSYNC);
    
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
    
        function mockCommandDirectory(commandScript)
        {
            fs.readdirSync = 
                jest.fn(() => [`../../tests/_mocks/commands/${commandScript}.js`]);
        }
    
        async function expectInvalidCommand(run, message)
        {
            await expect(run).rejects.toThrow(InvalidCommand);
            await expect(run).rejects.toThrow(message);
        }
        
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

    describe("Test REST call to discord.", () => {
        
        const ORIGINAL_REST_PUT = REST.put;
        beforeAll(() => {
            REST.prototype.put = jest.fn(async () => 
                { throw new Error("mock rest error"); }
            );
        });
        afterAll(() => {
            REST.prototype.put = ORIGINAL_REST_PUT;
        })

        test("CommandManagerError when REST call to deploy to discord fails.", async() => {
            let run = commandManager.run();
            await expect(run).rejects.toThrow(CommandManagerError);
            await expect(run).rejects.toThrow("Failed to deploy commands to discord");
        });
    });
});

// =========================
// =====EXECUTE COMMAND=====
// =========================

// todo: add tests for execute public error vs other error

describe("Testing execute method", () => {
   
    let commandManager;
    let interaction;
    beforeEach(() => {
        commandManager = new CommandManager();
        interaction = {};
    });

    test(
        "CommandExecutionError when interaction is not a command interaction.", 
        async() => 
    {
        interaction.isCommand = () => false;
        let execute = commandManager.executeCommand(interaction);
        await expectCommandExecutionError(
            execute, "Cannot execute a command for a non command interaction"
        );
    });

    describe("Command interaction.", () => {
        beforeEach(() => interaction.isCommand = () => true);

        test(
            "CommandExecutionError when command is not recognized.", 
            async() => 
        {
            interaction.commandName = "unknowncommand";
            let execute = commandManager.executeCommand(interaction);
            await expectCommandExecutionError(
                execute, "Did not recognize the command name 'unknowncommand'"
            );
        });

        test("Response of command's execute sent to discord as a reply.", async() => {
            
            commandManager.commands.set("somecommand", {
                name: "somecommand",
                description: "some description",
                execute: async() => { return "some response" }
            });

            interaction.commandName = "somecommand";
            interaction.deferReply = async() => {};
            interaction.user = { username: "someuser" };
            interaction.editReply = jest.fn(async (reply) => {});

            await commandManager.executeCommand(interaction);
            expect(interaction.editReply.mock.calls.length).toBe(1);
            expect(interaction.editReply.mock.calls[0][0]).toBe("some response");

        });
    });

    async function expectCommandExecutionError(execute, message)
    {
        await expect(execute).rejects.toThrow(CommandExecutionError);
        await expect(execute).rejects.toThrow(message);
    }
});







