import { DontBeKoiBot } from "../src/DontBeKoiBot";

const ORIGINAL_ENV: NodeJS.ProcessEnv = process.env;

// before each test remove env variables
beforeEach(() => {

    // remove environment variables
    process.env = { ...ORIGINAL_ENV };
    delete process.env.BOT_TOKEN;

});
  
// after each test,
// revert env variables and stop the bot in case it was started
afterEach(() => {

    // revert environment variables
    process.env = ORIGINAL_ENV;

    // stop the bot
    DontBeKoiBot.getInstance().stop();

});

test("The bot can be started and stopped.", async () => {
    process.env.BOT_TOKEN = ORIGINAL_ENV.BOT_TOKEN;
    let bot = DontBeKoiBot.getInstance();
    await bot.start();
});

test("The bot errors when attempting to start without a bot token.", async () =>  {
    let bot = DontBeKoiBot.getInstance();
    await expect(bot.start()).rejects.toThrow();
});