const { Config, ConfigError } = require("../../src/util/config");

testEnvironmentVariable("Bot token");
testEnvironmentVariable("Client ID");
testEnvironmentVariable("Guild ID");
testEnvironmentVariable("Database URL");
testEnvironmentVariable("Google API key");

function testEnvironmentVariable(readableName)
{
    // example readableName: "Client ID"

    // get the environment key
    // in our example, it would be "CLIENT_ID"
    const ENV_KEY = readableName.toUpperCase().replaceAll(" ", "_");

    // get the method name
    // in our example, it would be "getClientId"
    let methodName = "get";
    for (let word of readableName.split(" "))
    {
        methodName += word[0].toUpperCase() + word.slice(1).toLowerCase();
    }

    describe(`${readableName} environment variable`, () => {

        // remove the environment variable before every test
        beforeEach(() => delete process.env[ENV_KEY]);

        test("Can get the environment variable when it is set.", () => {
            const value = "some Value";
            process.env[ENV_KEY] = value;
            expect(Config[methodName]()).toBe(value);
        });

        test("ConfigError getting the environment variable when it is not set.", () => {
            expect(() => Config[methodName]()).toThrow(ConfigError);
            expect(() => Config[methodName]()).toThrow(ENV_KEY);
        });
    });
}