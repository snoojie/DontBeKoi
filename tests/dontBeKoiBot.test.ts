import bot from "../src/DontBeKoiBot";

// the first time a bot is started, it takes about half a second
// but the following starts up are longer. 
// The max recorded so far is just shy of a minute;
// So, let's allow each startup to run for 1.5 minutes.
const TIMEOUT = 90000;

// after each test, 
// stop the bot just in case a test fails. 
// otherwise, the bot may hang
afterEach(() => bot.stop());

test("The bot can be started and stopped.", async () => {
    await bot.start();
    bot.stop();
}, TIMEOUT);

test("The bot can be safely stopped even if it has not started.", () => {
    bot.stop();
});

test("Starting the bot when it is already running causes an error.", async () => {
    await bot.start();
    await expect(bot.start()).rejects.toThrow();
}, 2 * TIMEOUT);

test("The bot can be started and stopped multiple times.", async () => {
    await bot.start();
    bot.stop();
    await bot.start();
    bot.stop();
}, 2 * TIMEOUT);

describe("No bot token in env", () => {

    const ORIGINAL_ENV: NodeJS.ProcessEnv = process.env;

    beforeAll(() => {
        process.env = { ...ORIGINAL_ENV };
        delete process.env.BOT_TOKEN;
    })

    afterAll(() => {
        process.env = ORIGINAL_ENV;
    })
    
    test("Starting a bot without a token errors.", async () =>  {
        await expect(bot.start()).rejects.toThrow();
    });

    test("Starting a bot with an incorrect token errors.", async () =>  {
        process.env.BOT_TOKEN = "I am not valid";
        await expect(bot.start()).rejects.toThrow();
    });

});