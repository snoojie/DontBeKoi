import { Config } from "../../src/util/config";

const ORIGINAL_ENV: NodeJS.ProcessEnv = process.env;

beforeEach(() => {

    // remove environment variables
    process.env = { ...ORIGINAL_ENV };
    delete process.env.BOT_TOKEN;

});
  
afterEach(() => {

    // revert environment variables
    process.env = ORIGINAL_ENV;

});

test("get the bot token when it is set as an environment variable", () => {
    const TOKEN = "sometoken";
    process.env.BOT_TOKEN = TOKEN;
    expect(Config.getBotToken()).toBe(TOKEN);
});

test("getting the bot token throws error when it is not set as an environment variable", () => {
    expect(() => Config.getBotToken()).toThrow();
});