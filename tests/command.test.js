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

    testMissingProperty("name");
    
    testNotAStringProperty("name");

    test("Name with spaces.", async() => {
        mockCommandDirectory("nameWithSpaces");
        let run = commandManager.run();
        await expectInvalidCommand(run, "The name 'name with spaces' has spaces");
    });

    testLongProperty("name", "namethatisverylongjusttoolongwaytoolong");

    test("Name with capitals.", async() => {
        mockCommandDirectory("nameWithCapitals");
        let run = commandManager.run();
        await expectInvalidCommand(run, "The name 'SomeName' has uppercase letters");
    });

    test("Name with a period.", async() => {
        mockCommandDirectory("nameWithPeriod");
        let run = commandManager.run();
        await expectInvalidCommand(run, "The name 'some.name' has invalid characters");
    });

    // ==============================
    // =====DESCRIPTION PROPERTY=====
    // ==============================

    testMissingProperty("description");

    testNotAStringProperty("description");

    testLongProperty(
        "description", 
        "here is a description. it is very long. why so long? why not. " +
        "this is a test. it can be whatever. it just needs to be long."
    );

    // ==========================
    // =====EXECUTE PROPERTY=====
    // ==========================

    testMissingProperty("execute");

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

    function testMissingProperty(property)
    {
        test(`Missing ${property} property.`, async() => {
            mockCommandDirectory(`missing${capitalizeFirstLetter(property)}`);
            let run = commandManager.run();
            await expectInvalidCommand(run, `The ${property} property is missing`);
        });
    }

    function testNotAStringProperty(property)
    {
        test(`${capitalizeFirstLetter(property)} is not a string.`, async() => {
            mockCommandDirectory(`${property}NotString`);
            let run = commandManager.run();
            await expectInvalidCommand(
                run, `The ${property} '3' must be a string.`
            );
        });
    }

    function testLongProperty(property, value)
    {
        test(`Long ${property}.`, async() => {
            mockCommandDirectory(`${property}TooLong`);
            let run = commandManager.run();
            await expectInvalidCommand(run, `The ${property} '${value}' is too long`);
        });
    }

    function capitalizeFirstLetter(text)
    {
        return text[0].toUpperCase() + text.substring(1);
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