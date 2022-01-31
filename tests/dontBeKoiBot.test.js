const Bot = require("../src/DontBeKoiBot").default;
const Logger = require("../src/util/logger").default;
const ErrorMessages = require("../src/util/errorMessages").default;

// mute logger
Logger.log = jest.fn();

// the first time a bot is started, it takes about half a second
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

test("Starting the bot when it is already running causes an error.", async () => {
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

describe("Test login with invalid bot token.", () => {

    beforeEach(() => {
        process.env = { ...ORIGINAL_ENV };
        delete process.env.BOT_TOKEN
    });
    afterAll(() => process.env = ORIGINAL_ENV);
    
    test("Starting a bot without a token errors.", async () =>  {
        await expect(Bot.start()).rejects.toThrow(ErrorMessages.INVALID_TOKEN);
        
    });

    test("Starting a bot with an incorrect token errors.", async () =>  {
        process.env.BOT_TOKEN = "I am not valid";
        await expect(Bot.start()).rejects.toThrow(ErrorMessages.INVALID_TOKEN);
    });

    test("Can start the bot after a failed login attempt.", async () => {

        // purposely fail the start
        await expect(Bot.start()).rejects.toThrow(ErrorMessages.INVALID_TOKEN);

        // run the bot successfully
        process.env = ORIGINAL_ENV;
        await Bot.start();
    }, 2 * TIMEOUT);

});