import Config from "../../src/util/config";

const ORIGINAL_ENV: NodeJS.ProcessEnv = process.env;

beforeEach(() => {

    // remove environment variables
    process.env = { ...ORIGINAL_ENV };
    delete process.env.BOT_TOKEN;
    delete process.env.CLIENT_ID;
    delete process.env.GUILD_ID;
    delete process.env.DATABASE_URL;

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

test("get the bot client ID when it is set as an environment variable", () => {
    const CLIENT_ID = "someid";
    process.env.CLIENT_ID = CLIENT_ID;
    expect(Config.getClientId()).toBe(CLIENT_ID);
});

test("getting the bot client ID throws error when it is not set as an environment variable", () => {
    expect(() => Config.getClientId()).toThrow();
});

test("get the guild ID when it is set as an environment variable", () => {
    const GUILD_ID = "someid";
    process.env.GUILD_ID = GUILD_ID;
    expect(Config.getGuildId()).toBe(GUILD_ID);
});

test("getting the guild ID throws error when it is not set as an environment variable", () => {
    expect(() => Config.getGuildId()).toThrow();
});

test("get the database URL when it is set as an environment variable", () => {
    const DATABASE_URL = "someurl";
    process.env.DATABASE_URL = DATABASE_URL;
    expect(Config.getDatabaseUrl()).toBe(DATABASE_URL);
});

test("getting the database URL throws error when it is not set as an environment variable", () => {
    expect(() => Config.getDatabaseUrl()).toThrow();
});