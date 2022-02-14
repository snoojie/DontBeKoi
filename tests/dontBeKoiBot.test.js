const { Bot } = require("../src/DontBeKoiBot");
const { ConfigError } = require("../src/util/config");
const { default: Logger } = require("../src/util/logger");

// the first time the bot is started, it takes about half a second
// but the following starts up are longer. 
// The max recorded so far is just shy of a minute;
// So, let's allow each startup to run for 1.5 minutes.
const TIMEOUT = 90000;

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

test(
    "The bot can be safely started several times without stopping inbetween.", 
    async () => 
{
    await Bot.start();
    expectBotIsReadyLogged();
    
    Logger.log = jest.fn();
    await Bot.start();
    expect(Logger.log.mock.calls.length).toBe(1);
    expect(Logger.log.mock.calls[0][0]).toBe("Bot is already running.");

}, 2 * TIMEOUT);

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

// =======================
// =====ENV VARIABLES=====
// =======================

describe("Modified environment variables.", () => {

    const ORIGINAL_ENV = process.env;
    beforeEach(() => {
        process.env = { ...ORIGINAL_ENV };
        Logger.error = jest.fn();
        Logger.log = jest.fn();
     });
    afterEach(() => process.env = ORIGINAL_ENV);

    describe("Invalid bot token.", () => {

        beforeEach(() => delete process.env.BOT_TOKEN);
        
        test("No bot token.", async () => {
            await Bot.start();
            expectBotStartError(
                ConfigError, 
                "Did you forget to set BOT_TOKEN as an environment variable?"
            );
        });

        testStartAfterFailedAttempt("login attempt");

    });

    // ==================
    // =====COMMANDS=====
    // ==================

    describe("Command Manager in a failed state.", () => {

        beforeEach(() => delete process.env.CLIENT_ID);
        
        test("Start the bot when cannot deploy commands.", async () =>  {
            await Bot.start();
            expectBotStartError(
                ConfigError, 
                "Did you forget to set CLIENT_ID as an environment variable?"
            );    
        });

        testStartAfterFailedAttempt("command deployment attempt");

    });

    // todo test after failed database

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
        expect(ERROR).toBeInstanceOf(errorType)
        expect(ERROR.message).toBe(errorMessage);
    }

    function testStartAfterFailedAttempt(failedDescription)
    {
        test(`Can start the bot after a failed ${failedDescription}.`, async () => {

            // purposely fail the start
            await Bot.start();

            // run the bot successfully
            process.env = ORIGINAL_ENV;
            Logger.log = jest.fn();
            await Bot.start();
            expectBotIsReadyLogged();

        }, 2 * TIMEOUT);
    }
});

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