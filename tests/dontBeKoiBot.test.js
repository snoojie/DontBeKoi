const Bot = require("../src/DontBeKoiBot").default;
const Logger = require("../src/util/logger").default;
const ErrorMessages = require("../src/errorMessages").default;

// mute logger
Logger.log = jest.fn();

// the first time the bot is started, it takes about half a second
// but the following starts up are longer. 
// The max recorded so far is just shy of a minute;
// So, let's allow each startup to run for 1.5 minutes.
const TIMEOUT = 90000;

const ORIGINAL_ENV = process.env;

// after each test, 
// stop the bot just in case a test fails. 
// otherwise, the bot may hang
afterEach(async () => await Bot.stop());

// ================================
// =====GENERAL START AND STOP=====
// ================================

test("The bot can be started and stopped.", async () => {
    await Bot.start();
    await Bot.stop();
}, TIMEOUT);

test("The bot can be safely stopped even if it has not started.", async () => {
    await Bot.stop();
});

test("Error starting the bot when it is already running.", async () => {
    await Bot.start();
    await expect(Bot.start()).rejects.toThrow(ErrorMessages.BOT.ALREADY_RUNNING);
}, 2 * TIMEOUT);

test("The bot can be started and stopped multiple times.", async () => {
    await Bot.start();
    await Bot.stop();
    await Bot.start();
    await Bot.stop();
}, 2 * TIMEOUT);

// ===============
// =====LOGIN=====
// ===============

describe("Test with modified environment variables.", () => {

    beforeEach(() => {
        process.env = { ...ORIGINAL_ENV };
    });
    afterAll(() => process.env = ORIGINAL_ENV);

    describe("Test login with invalid bot token.", () => {

        beforeEach(() => delete process.env.BOT_TOKEN);
        
        test("Error starting the bot without a token.", async () =>  {
            await expect(Bot.start()).rejects.toThrow(
                ErrorMessages.CONFIG.MISSING_ENVIRONMENT_VARIABLE
            );
            
        });

        test("Error starting the bot with an incorrect token.", async () =>  {
            process.env.BOT_TOKEN = "I am not valid";
            await expect(Bot.start()).rejects.toThrow(ErrorMessages.BOT.FAILED_LOGIN);
        });

        testStartAfterFailedAttempt("login attempt");

    });

    // ==================
    // =====COMMANDS=====
    // ==================

    describe("Test running the Command Manager with it in a failed state.", () => {

        beforeEach(() => delete process.env.CLIENT_ID);
        
        test("Error starting the bot when cannot deploy commands.", async () =>  {
            await expect(Bot.start()).rejects.toThrow();        
        });

        testStartAfterFailedAttempt("command deployment attempt");

    });

    function testStartAfterFailedAttempt(failedDescription)
    {
        test(`Can start the bot after a failed ${failedDescription}.`, async () => {

            // purposely fail the start
            await expect(Bot.start()).rejects.toThrow();

            // run the bot successfully
            process.env = ORIGINAL_ENV;
            await Bot.start();
        }, 2 * TIMEOUT);
    }
});