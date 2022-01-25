const Config = require("../../src/util/config").default;

const ORIGINAL_ENV = process.env;

testEnvironmentVariable("Bot token");
testEnvironmentVariable("Client ID");
testEnvironmentVariable("Guild ID");
testEnvironmentVariable("Database URL");

function testEnvironmentVariable(readableName, envKey)
{
    // example readableName: "Client ID"

    // get the environment key
    // in our example, it would be "CLIENT_ID"
    const ENV_KEY = readableName.toUpperCase().replace(" ", "_");

    // get the method name
    // in our example, it would be "getClientId"
    let methodName = "get";
    for (let word of readableName.split(" "))
    {
        methodName += word[0].toUpperCase() + word.slice(1).toLowerCase();
    }

    describe(`${readableName} environment variable`, () => {

        // remove the environment variable before every test
        // when all tests are done, revert environment variables
        beforeEach(() => {
            process.env = { ...ORIGINAL_ENV };
            delete process.env[ENV_KEY];
        });
        afterAll(() => {
            process.env = ORIGINAL_ENV;
        })

        test("Can get the environment variable when it is set.", () => {
            const value = "some Value";
            process.env[ENV_KEY] = value;
            expect(Config[methodName]()).toBe(value);
        });

        test("Error getting the environment variable when it is not set.", () => {
            expect(() => Config[methodName]()).toThrow();
        });
    });
}