const Bot = require("../src/DontBeKoiBot").default;
const { CommandManager } = require("../src/command");
const { default: Logger } = require("../src/util/logger");

// the first time the bot is started, it takes about half a second
// but the following starts up are longer. 
// The max recorded so far is just shy of a minute;
// So, let's allow each startup to run for 1.5 minutes.
const TIMEOUT = 90000;

const ORIGINAL_ENV = process.env;
beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    Logger.error = jest.fn();
    Logger.log = jest.fn();
});

// after each test, 
// stop the bot just in case a test fails. 
// otherwise, the bot may hang
afterEach(async () => await Bot.stop());

// ================================
// =====GENERAL START AND STOP=====
// ================================

test("The bot can be started and stopped.", async () => {
    await Bot.start();
    expectBotIsReadyLogged();

    await Bot.stop();
    expectBotIsStoppedLogged();
}, TIMEOUT);

test("The bot can be safely stopped even if it has not started.", async () => {
    await Bot.stop();
    expectBotIsStoppedLogged();
});

test("The bot can be started and stopped multiple times.", async () => {
    await Bot.start();
    expectBotIsReadyLogged();

    await Bot.stop();
    expectBotIsStoppedLogged();

    await Bot.start();
    expectBotIsReadyLogged();

    await Bot.stop();
    expectBotIsStoppedLogged();
}, 2 * TIMEOUT);

// ======================
// =====START ERRORS=====
// ======================

test(
    "The bot logs that it is already running if it gets started twice without a stop.",
    async () => 
{
    await Bot.start();
    expectBotIsReadyLogged();
    
    Logger.log = jest.fn();
    await Bot.start();
    expect(Logger.log.mock.calls.length).toBe(1);
    expect(Logger.log.mock.calls[0][0]).toBe("Bot is already running.");

}, 2 * TIMEOUT);

test("No BOT_TOKEN environment variable.", async () => {
    delete process.env.BOT_TOKEN;
    await Bot.start();
    expectBotStartError(
        "ConfigError", 
        "Did you forget to set BOT_TOKEN as an environment variable?"
    );
});

test("Invalid BOT_TOKEN environment variable.", async () => {
    process.env.BOT_TOKEN = "invalidtoken";
    await Bot.start();
    expectBotStartError(
        "BotError", 
        "Failed to login to discord. Could the token be invalid?"
    );
});

test("Can start the bot after a failed start attempt.", async() => {
    delete process.env.BOT_TOKEN;
    await Bot.start();
    expectBotStartError(
        "ConfigError", 
        "Did you forget to set BOT_TOKEN as an environment variable?"
    );
    
    Logger.log = jest.fn();
    process.env = ORIGINAL_ENV;
    await Bot.start();
    expectBotIsReadyLogged();

}, 2 * TIMEOUT);

describe("Running CommandManager errors.", () => {

    const ORIGINAL_COMMAND_MANAGER_RUN = CommandManager.prototype.run;
    afterEach(() => CommandManager.prototype.run = ORIGINAL_COMMAND_MANAGER_RUN );

    test("Failed bot start.", async () => {
        CommandManager.prototype.run = jest.fn(async() => { throw new Error("oops"); });
        await Bot.start();
        expectBotStartError("Error", "oops");
    });
});

// todo: database

function expectBotStartError(errorType, errorMessage)
{
    // never log the bot is ready
    for (const LOG_CALL of Logger.log.mock.calls)
    {
        expect(LOG_CALL[0]).not.toBe("Bot is ready!");
    }

    // error is logged

    expect(Logger.error.mock.calls.length).toBe(2);
    expect(Logger.error.mock.calls[0][0]).toBe("Error occured. Stopping the bot...");

    const ERROR = Logger.error.mock.calls[1][0];
    expect(ERROR).toBeInstanceOf(Error)
    expect(ERROR.name).toBe(errorType);
    expect(ERROR.message).toBe(errorMessage);
}

function expectBotIsReadyLogged()
{
    expect(Logger.log.mock.calls[Logger.log.mock.calls.length-1][0])
        .toBe("Bot is ready!");
}

function expectBotIsStoppedLogged()
{
    expect(Logger.log.mock.calls[Logger.log.mock.calls.length-1][0])
        .toBe("Bot stopped.");
}