const { CommandManager, InvalidCommand } = require("../src/command");
const { ConfigError } = require("../src/util/config");
const fs = require("fs");

const ORIGINAL_FS_READDIRSYNC = fs.readdirSync;

test("Can create an instance of CommandManager.", () => {
    new CommandManager();
});

// =============
// =====RUN=====
// =============

test("Can deploy commands to discord server.", async () => {
    let commandManager = new CommandManager();
    await commandManager.run();
});

describe("Validate command scripts.", () => {

    let commandManager;
    beforeEach(() => commandManager = new CommandManager());
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
        await expectInvalidCommand(run, "The command name 'name with spaces' has spaces");
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
            "The description 'here is a description. it is very long. why so long? " +
            "why not. this is a test. it can be whatever. it just needs to be long.' " +
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
            "The command 'somename' has multiple options of the same name 'someoption'"
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
            run, "The option name 'some option name' on command 'somename' has spaces"
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
            run, "The description 'undefined' on command 'somename' is missing"
        );
    });

    test("Option description is not a string.", async() => {
        mockCommandDirectory("optionDescriptionNotString");
        let run = commandManager.run();
        await expectInvalidCommand(
            run, "The description '6' on command 'somename' must be a string"
        );
    });

    test("Option long description.", async() => {
        mockCommandDirectory("optionDescriptionTooLong");
        let run = commandManager.run();
        await expectInvalidCommand(
            run, 
            "The description 'here is a description. it is very long. why so long? " +
            "why not. this is a test. it can be whatever. it just needs to be long.' " +
            "on command 'somename' is too long"
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

    // after each test, 
    // restore environment variables
    // as they will be individually removed in each test
    afterEach(() => process.env = { ...ORIGINAL_ENV });

    testMissingEnvironmentVariable("BOT_TOKEN");
    testMissingEnvironmentVariable("CLIENT_ID");
    testMissingEnvironmentVariable("GUILD_ID");

    function testMissingEnvironmentVariable(envKey)
    {
        const READABLE_ENV_KEY = envKey.toLowerCase().replace("_", " ");
        test(`Error deploying commands without a ${READABLE_ENV_KEY}.`, async () => {
            delete process.env[envKey];
            let commandManager = new CommandManager();
            await expect(commandManager.run()).rejects.toThrow(ConfigError);
        });
    }
});