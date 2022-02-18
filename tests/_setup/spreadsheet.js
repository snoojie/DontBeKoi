const { InvalidGoogleApiKey } = require("../../src/google/spreadsheet");
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

            test("InvalidGoogleApiKey without GOOGLE_API_KEY.", async() => {
                delete process.env.GOOGLE_API_KEY;
                await expectInvalidGoogleApiKey(methodToTest);
            });

            test("InvalidGoogleApiKey with invalid GOOGLE_API_KEY.", async() => {
                process.env.GOOGLE_API_KEY = "invalidkey";
                await expectInvalidGoogleApiKey(methodToTest);
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