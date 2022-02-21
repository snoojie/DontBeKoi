const { InvalidGoogleApiKey } = require("../../src/google/spreadsheet");
const { ConfigError } = require("../../src/util/config");
const { expectErrorAsync } = require("./testUtil");

const GOOGLE_QUOTA_TIMEOUT = 70000;

module.exports = {

    /**
     * Wait a minute before running tests.
     * This is because Google has a quota on read per minute.
     */
    waitGoogleQuota: async function()
    {
        return new Promise(resolve => setTimeout(resolve, GOOGLE_QUOTA_TIMEOUT));
    },

    googleQuotaTimeout: GOOGLE_QUOTA_TIMEOUT+20000,

    spreadsheets: {
        community: "1Y717KMb15npzEv3ed2Ln2Ua0ZXejBHyfbk5XL_aZ4Qo",
        test: "1yt01AXsDvBrGpKyVETKlsgJhetUJq5eOMLx5Sf60TAU",

        // extra empty row in pattern moduro
        formatBroken: "1fMMI5wGrD7d4Z5M9APlwoMzHG6QeZQvXK4qQ91yFDaQ",

        private: "1bh3vHHqypdig1C1JAM95LYwvw0onkZ0k12jq0y4YYN8",

        // renamed sheet tab for a-m collectors
        badRange: "1nZFn5D9CxDtdUX4BAsmrosu1yTevllZ_YKKVOpabPCs"
    },

    getSpreadsheetErrorMessage: function(spreadsheetId, range)
    {
        return `Could not get range '${range}' at spreadsheet '${spreadsheetId}'. ` +
            "Could the spreadsheet ID, range, or Google API key be invalid?";
    },
    
    testWithModifiedEnv: function(description, methodToTest)
    {
        describe(`${description} with modified environment variables.`, () => {
            
            const ORIGINAL_ENV = process.env;
            beforeEach(() => process.env = { ...ORIGINAL_ENV });
            afterAll(() => process.env = { ...ORIGINAL_ENV });

            test("ConfigError without GOOGLE_API_KEY.", async() => {
                delete process.env.GOOGLE_API_KEY;
                await expectErrorAsync(
                    methodToTest(), 
                    ConfigError, 
                    "Did you forget to set GOOGLE_API_KEY as an environment variable?"
                );
            });

            test("InvalidGoogleApiKey with invalid GOOGLE_API_KEY.", async() => {
                process.env.GOOGLE_API_KEY = "invalidkey";
                await expectErrorAsync(
                    methodToTest(), 
                    InvalidGoogleApiKey, 
                    "The Google API key is invalid or missing."
                );
            });

            async function expectInvalidGoogleApiKey(methodToTest)
            {
                await expectErrorAsync(
                    methodToTest(), 
                    InvalidGoogleApiKey, 
                    "The Google API key is invalid or missing."
                );
            }
        });
    }
};