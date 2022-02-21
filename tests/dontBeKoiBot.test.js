const Bot = require("../src/DontBeKoiBot").default;
const { CommandManager } = require("../src/command");
const { default: Logger } = require("../src/util/logger");
let { Client } = require("discord.js");

const TIMEOUT = 90000;

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
            "Error [TOKEN_INVALID]", 
            "An invalid token was provided."
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

        expectLogError(0, errorMessage, errorType);

        expectStopLogs(1, 1);
    }
});

describe("Modified CommandManager.", () => {

    const ORIGINAL_COMMAND_MANAGER_RUN = CommandManager.prototype.run;
    afterAll(() => CommandManager.prototype.run = ORIGINAL_COMMAND_MANAGER_RUN);

    test("Bot stops if there was an error running CommandManager.", async() => {
        CommandManager.prototype.run = 
            jest.fn(async() => { throw new Error("failed run"); });
        await Bot.start();
        
        expectLog(0, "Starting bot...");
        expectLogPartials(0, "    Logging into discord...", "..Logged in.");
        expectLogPartials(2, "    Setting up commands...");

        expectLogError(0, "failed run", "Error");

        expectStopLogs(1, 3);
    }, TIMEOUT);
});

// todo fail start with database error

// =========================
// =====EXECUTE COMMAND=====
// =========================

describe("Executing commands.", () => {

    const ORIGINAL_EXECUTE_COMMAND = CommandManager.prototype.executeCommand;
    let discordSpy = jest.spyOn(Client.prototype, "on");
    beforeEach(() => discordSpy.mockClear() );
    afterEach(() => 
        CommandManager.prototype.executeCommand = ORIGINAL_EXECUTE_COMMAND 
    );

    test("Command is executed on a discord interaction.", async() => {
        CommandManager.prototype.executeCommand = jest.fn();
        await Bot.start();
        await triggerInteractionCreateEvent();
        
        expect(CommandManager.prototype.executeCommand.mock.calls.length).toBe(1);
    }, TIMEOUT);

    test("Logs when command execution errors.", async() => {
        CommandManager.prototype.executeCommand = jest.fn(async() => {
            throw new Error("failed execution");
        });
        await Bot.start();
        resetLoggerMocks();
        await triggerInteractionCreateEvent();

        expectLogError(0, "Error occured executing the interaction.");
        expectLogError(1, "failed execution", "Error");
        expectLogError(2, { somekey: "i am an interaction"} );


    }, TIMEOUT);

    async function triggerInteractionCreateEvent()
    {
        let discord = discordSpy.mock.instances[0];
        discord.emit("interactionCreate", { somekey: "i am an interaction" });
        
        // wait for the event handler code to finish executing
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
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

function expectLogError(i, message, type)
{
    const ERROR = Logger.error.mock.calls[i][0];
    if (type)
    {
        expect(ERROR.name).toBe(type);
        expect(ERROR.message).toBe(message);
    }
    else
    {
        expect(ERROR).toEqual(message);
    }
}

function expectStartLogs()
{
    expectLog(0, "Starting bot...");
    expectLogPartials(0, "    Logging into discord...", "..Logged in.");
    expectLogPartials(2, "    Setting up commands...", "...Commands set up.");
    expectLogPartials(4, "    Setting up data.....", ".....Data set up.");
    expectLog(1, "Bot is ready!");

    expectLogCounts(2, 6, 0);
}

function expectStopLogs(startLogIndex, startLogPartialIndex)
{
    startLogIndex        = !startLogIndex        ? 0 : startLogIndex;
    startLogPartialIndex = !startLogPartialIndex ? 0 : startLogPartialIndex;

    expectLog(startLogIndex, "Stopping the bot...");
    expectLogPartials(startLogPartialIndex,   "    Disconnecting from discord...", "...Disconnected from discord.");
    expectLogPartials(startLogPartialIndex+2, "    Stopping data services.....", ".....Data services stopped.");
    expectLog(startLogIndex+1, "Bot stopped.");

    const ERROR_COUNT = !startLogIndex ? 0 : 1;
    expectLogCounts(startLogIndex+2, startLogPartialIndex+4, ERROR_COUNT);
}
