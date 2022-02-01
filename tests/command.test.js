const { CommandManager } = require("../src/command");
const ErrorMessages = require("../src/errorMessages").default;

test("Can create an instance of CommandManager.", () => {
    new CommandManager();
})

// =============
// =====RUN=====
// =============

test("Can deploy commands to discord server.", async () => {
    let commandManager = new CommandManager();
    await commandManager.run();
}, 60000)

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