const { CommandManager, InvalidCommand } = require("../src/command");
const ErrorMessages = require("../src/errorMessages").default;
const fs = require("fs");

const ORIGINAL_FS_READDIRSYNC = fs.readdirSync;

test("Can create an instance of CommandManager.", () => {
    new CommandManager();
})

// =============
// =====RUN=====
// =============

test("Can deploy commands to discord server.", async () => {
    let commandManager = new CommandManager();
    await commandManager.run();
});

testMissingProperty("name");
testMissingProperty("description");
testMissingProperty("execute");
function testMissingProperty(property)
{
    describe(`Test command script with missing ${property} proeprty.`, () => {

        const COMMAND_SCRIPT = `../../tests/_mocks/commands/` + 
                `missing${property[0].toUpperCase()}${property.substring(1)}.js`;

        afterAll(() =>  fs.readdirSync = ORIGINAL_FS_READDIRSYNC);

        test(`Error of type InvalidCommand.`, async() => {
            fs.readdirSync = jest.fn(() => [COMMAND_SCRIPT]);
            let commandManager = new CommandManager();
            await expect(commandManager.run()).rejects.toThrow(InvalidCommand);
        });

        test(`Error message mentions ${property}.`, async() => {
            fs.readdirSync = jest.fn(() => [COMMAND_SCRIPT]);
            let commandManager = new CommandManager();
            await expect(commandManager.run()).rejects.toThrow(property);
        });
    });
}

// todo test invalid properties, like name having spaces


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
            await expect(commandManager.run()).rejects.toThrow(
                ErrorMessages.CONFIG.MISSING_ENVIRONMENT_VARIABLE
            );
        });
    }
});