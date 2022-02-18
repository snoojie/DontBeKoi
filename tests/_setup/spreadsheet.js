const { SpreadsheetError } = require("../../src/google/spreadsheet");
const { ConfigError } = require("../../src/util/config");
const { expectErrorAsync } = require("./testUtil");

const GOOGLE_QUOTA_TIMEOUT = 90000;

module.exports = {

    /**
     * Wait a minute before running tests.
     * This is because Google has a quota on read per minute.
     */
    waitGoogleQuota: async function()
    {
        return new Promise(resolve => setTimeout(resolve, GOOGLE_QUOTA_TIMEOUT));
    },

    googleQuotaTimeout: GOOGLE_QUOTA_TIMEOUT,

    getSpreadsheetErrorMessage: function(spreadsheetId, range)
    {
        return `Could not get range '${range}' at spreadsheet '${spreadsheetId}'. ` +
            "Could the spreadsheet ID, range, or Google API key be invalid?";
    },
    
    testWithModifiedEnv: function(description, methodToTest, spreadsheetErrorMessage)
    {
        describe(`${description} with modified environment variables.`, () => {
            
            const ORIGINAL_ENV = process.env;
            beforeEach(() => process.env = { ...ORIGINAL_ENV });
            afterAll(() => process.env = { ...ORIGINAL_ENV });

            test("ConfigError without GOOGLE_API_KEY.", async() => {
                delete process.env.GOOGLE_API_KEY;
                let promise = methodToTest();
                await expectErrorAsync(
                    promise, 
                    ConfigError,
                    "Did you forget to set GOOGLE_API_KEY as an environment variable?"
                );
            });

            test("SpreadsheetError with invalid GOOGLE_API_KEY.", async() => {
                process.env.GOOGLE_API_KEY = "invalidkey";
                let promise = methodToTest();
                await expectErrorAsync(
                    promise, SpreadsheetError, spreadsheetErrorMessage
                );
            });
        });
    }
};