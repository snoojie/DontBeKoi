const { CommandManager } = require("../src/command");

test("Can create an instance of CommandManager.", () => {
    new CommandManager();
})

test("No error when deploying commands to discord server.", async () => {
    let commandManager = new CommandManager();
    await commandManager.run();
}, 30000)

describe("Missing environment variables", () => {

    const ORIGINAL_ENV = process.env;

    // after each test, 
    // restore environment variables
    // as they will be individually removed in each test
    afterEach(() => {
        process.env = { ...ORIGINAL_ENV };
    });

    test("Error when deploying commands without a bot token in environment variables.", async () => {
        delete process.env.BOT_TOKEN;
        let commandManager = new CommandManager();
        await expect(commandManager.run()).rejects.toThrow();
    });

    test("Error when deploying commands without a client ID in environment variables.", async () => {
        delete process.env.CLIENT_ID;
        let commandManager = new CommandManager();
        await expect(commandManager.run()).rejects.toThrow();
    });

    test("Error when deploying commands without a guild ID in environment variables.", async () => {
        delete process.env.GUILD_ID;
        let commandManager = new CommandManager();
        await expect(commandManager.run()).rejects.toThrow();
    });
});