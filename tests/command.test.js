const { CommandManager } = require("../src/command");
const ErrorMessages = require("../src/errorMessages").default;

test("Can create an instance of CommandManager.", () => {
    new CommandManager();
})

test("No error when deploying commands to discord server.", async () => {
    let commandManager = new CommandManager();
    await commandManager.run();
}, 60000)

describe("Missing environment variables", () => {

    const ORIGINAL_ENV = process.env;

    // after each test, 
    // restore environment variables
    // as they will be individually removed in each test
    afterEach(() => {
        process.env = { ...ORIGINAL_ENV };
    });

    test("Error deploying commands without a bot token.", async () => {
        delete process.env.BOT_TOKEN;
        let commandManager = new CommandManager();
        await expect(commandManager.run()).rejects.toThrow(
            ErrorMessages.CONFIG.MISSING_ENVIRONMENT_VARIABLE
        );
    });

    test("Error deploying commands without a client ID.", async () => {
        delete process.env.CLIENT_ID;
        let commandManager = new CommandManager();
        await expect(commandManager.run()).rejects.toThrow(
            ErrorMessages.CONFIG.MISSING_ENVIRONMENT_VARIABLE
        );
    });

    test("Error deploying commands without a guild ID.", async () => {
        delete process.env.GUILD_ID;
        let commandManager = new CommandManager();
        await expect(commandManager.run()).rejects.toThrow(
            ErrorMessages.CONFIG.MISSING_ENVIRONMENT_VARIABLE
        );
    });
});