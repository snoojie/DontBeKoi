const Bot = require("../src/DontBeKoiBot").default;
const { CommandManager } = require("../src/command");
const { default: Logger } = require("../src/util/logger");

const TIMEOUT = 120000;

beforeEach(() => resetLoggerMocks() );

// after each test, 
// stop the bot just in case a test fails. 
// otherwise, the bot may hang
afterEach(async () => await Bot.stop());

// ==================================
// =====SUCESSFUL START AND STOP=====
// ==================================

test("Starting the bot logs its progress.", async() => {
    await Bot.start();
    expectStartLogs();    
}, TIMEOUT);

test("Stopping the bot logs its progress.", async() => {
    await Bot.start();

    resetLoggerMocks();
    await Bot.stop();

    expectStopLogs();
}, TIMEOUT);

test("Can start the bot after stopping.", async() => {
    await Bot.start();
    await Bot.stop();

    resetLoggerMocks();
    await Bot.start();
    
    expectStartLogs();
}, TIMEOUT);

test("Starting the bot twice without stopping logs that it is already running.", 
    async() => 
{
    await Bot.start();

    resetLoggerMocks();
    await Bot.start();

    expectLog(0, "Bot is already running.");
    expectLogCounts(1, 0, 0);
}, TIMEOUT);

// ==========================
// =====ERROR WITH START=====
// ==========================

describe("Modified BOT_TOKEN.", () => {

    const ORIGINAL_ENV = process.env;
    beforeEach(() => process.env = { ...ORIGINAL_ENV });
    afterAll(()   => process.env = { ...ORIGINAL_ENV });

    test("Bot stops if BOT_TOKEN is not set.", async() => {
        delete process.env.BOT_TOKEN;
        await Bot.start();
        expectFailedStartDuringDiscordLoginLogs(
            "ConfigError", "Did you forget to set BOT_TOKEN as an environment variable?"
        );
    }, TIMEOUT);

    test("Bot stops if BOT_TOKEN is invalid.", async() => {
        process.env.BOT_TOKEN = "invalidtoken";
        await Bot.start();
        expectFailedStartDuringDiscordLoginLogs(
            "BotError", "Failed to login to discord. Could the token be invalid?"
        );
    }, TIMEOUT);

    test("Can start the bot after a failed start.", async() => {
        // break the start
        delete process.env.BOT_TOKEN;
        await Bot.start();

        // do a successful start
        process.env = ORIGINAL_ENV;
        resetLoggerMocks();
        await Bot.start();
        expectStartLogs();
    }, TIMEOUT);

    function expectFailedStartDuringDiscordLoginLogs(errorType, errorMessage)
    {
        expectLog(0, "Starting bot...");
        expectLogPartials(0, "    Logging into discord...");

        expectLogError(errorType, errorMessage);

        expectStopLogs(1, 1);
    }
});

describe("Modified CommandManager.", () => {

    const ORIGINAL_COMMAND_MANAGER_RUN = CommandManager.prototype.run;
    afterAll(()   => CommandManager.prototype.run = ORIGINAL_COMMAND_MANAGER_RUN);

    test("Bot stops if there was an error running CommandManager.", async() => {
        CommandManager.prototype.run = 
            jest.fn(async() => { throw new Error("failed run"); });
        await Bot.start();
        
        expectLog(0, "Starting bot...");
        expectLogPartials(0, "    Logging into discord...", "..Logged in.");
        expectLogPartials(2, "    Setting up commands...");

        expectLogError("Error", "failed run");

        expectStopLogs(1, 3);
    }, TIMEOUT);
});

function resetLoggerMocks()
{
    Logger.error = jest.fn();
    Logger.log = jest.fn();
    Logger.logPartial = jest.fn();
}

function expectLogCounts(logCount, logPartialCount, errorCount)
{
    expect(Logger.log.mock.calls.length).toBe(logCount);
    expect(Logger.logPartial.mock.calls.length).toBe(logPartialCount);
    expect(Logger.error.mock.calls.length).toBe(errorCount);
}

function expectLog(i, message)
{
    expect(Logger.log.mock.calls[i][0]).toBe(message);
}

function expectLogPartials(i, firstHalf, secondHalf)
{
    expect(Logger.logPartial.mock.calls[i]).toEqual([firstHalf]);
    if (secondHalf)
    {
        expect(Logger.logPartial.mock.calls[i+1]).toEqual([secondHalf, true]);
    }
}

function expectLogError(type, message)
{
    const ERROR = Logger.error.mock.calls[0][0];
    expect(ERROR.name).toBe(type);
    expect(ERROR.message).toBe(message);
}

function expectStartLogs()
{
    expectLog(0, "Starting bot...");
    expectLogPartials(0, "    Logging into discord...", "..Logged in.");
    expectLogPartials(2, "    Setting up commands...", "...Commands set up.");
    expectLogPartials(4, "    Setting up database...", "...Database set up.");
    expectLog(1, "Bot is ready!");

    expectLogCounts(2, 6, 0);
}

function expectStopLogs(startLogIndex, startLogPartialIndex)
{
    startLogIndex        = !startLogIndex        ? 0 : startLogIndex;
    startLogPartialIndex = !startLogPartialIndex ? 0 : startLogPartialIndex;

    expectLog(startLogIndex, "Stopping the bot...");
    expectLogPartials(startLogPartialIndex,   "    Disconnecting from discord...", "..Disconnected from discord.");
    expectLogPartials(startLogPartialIndex+2, "    Stopping the database.....", ".....Database stopped.");
    expectLog(startLogIndex+1, "Bot stopped.");

    const ERROR_COUNT = !startLogIndex ? 0 : 1;
    expectLogCounts(startLogIndex+2, startLogPartialIndex+4, ERROR_COUNT);
}



/*

function expectStartWithErrorLogs(maxLogPartialCalls)
{
    expectStartLogs(maxLogPartialCalls);
    expectStopLogs(1, maxLogPartialCalls);
}

function expectStartLogs(maxLogPartialCalls)
{
    maxLogPartialCalls = maxLogPartialCalls==undefined ? 6 : maxLogPartialCalls;

    const LOG_CALLS = Logger.log.mock.calls;
    const LOG_PARTIAL_CALLS = Logger.logPartial.mock.calls;

    expectLog(0, "Starting bot...");

    if (maxLogPartialCalls < 2)
    {
        expectLogPartials(0, "    Logging into discord...");
    }
    else
    {
        expectLogPartials(0, "    Logging into discord...", "..Logged in.");

        if (maxLogPartialCalls < 4)
        {
            expectLogPartials(2, "    Setting up commands...");
        }
        else
        {
            expectLogPartials(2, "    Setting up commands...", "...Commands set up.");
            if (maxLogPartialCalls < 6)
            {
                expectLogPartials(4, "    Setting up database...");
            }
            else
            {
                expectLogPartials(4, "    Setting up database...", "...Database set up.");
                expectLog(1, "Bot is ready!");
            }
        }
    }

    const LOG_COUNT   = maxLogPartialCalls < 6 ? 1 : 2;
    const ERROR_COUNT = maxLogPartialCalls < 6 ? 1 : 0;
    expectLogCounts(LOG_COUNT, maxLogPartialCalls, ERROR_COUNT);
}

function expectStopLogs(startLogIndex, startLogPartialIndex)
{
    startLogIndex        = !startLogIndex        ? 0 : startLogIndex;
    startLogPartialIndex = !startLogPartialIndex ? 0 : startLogPartialIndex;
    startErrorIndex      = !startLogIndex        ? 0 : 1;

    expectLog(startLogIndex, 
        "Stopping the bot...");
    expectLogPartials(startLogPartialIndex,   
        "    Disconnecting from discord...", "..Disconnected from discord.");
    expectLogPartials(startLogPartialIndex+2, 
        "    Stopping the database.....", ".....Database stopped.");
    expectLog(startLogIndex, 
        "Bot stopped.");

    expectLogCounts(startLogIndex+2, startLogIndex+4, startErrorIndex);
}
*/


// ================================
// =====GENERAL START AND STOP=====
// ================================
/*


// ======================
// =====START ERRORS=====
// ======================


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
}*/