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

        // copy of snooj's
        valid: "1Sed1Z5n8mcfyDj-v4fv5CxiVyg1N0B2qLYpMW6qIhSQ",

        // copy of lucy's
        valid2: "1_V4OmDhHzNDVJ3cbO_XSfYJ54zkjcFab1AT4hOzxvMM",

        // coris's spreadsheet
        community: "1Y717KMb15npzEv3ed2Ln2Ua0ZXejBHyfbk5XL_aZ4Qo",

        // private spreadsheet
        private: "1YzaW_f2ID5qDSAYn4inf_4clb8WpfnletqyYhI6HA7E",

        // both collectors sheets are renamed
        renamedSheets: "1RFiWTw8PGDsXFYaLbZ0ia6RL45WxmcBXOKTjOqfO784",

        // ryoukon akachan marked with '   '
        // ryodai akachan marked with 'invalid'
        // ryopinku akachan marked with capital 'K'
        // ryosumi akachan marked with capital 'D'
        // kudai akachan marked with '  k  '
        // kupinku akachan marked with '  d  '
        badKoiProgressMarks: "12czz7UDLzlX6qzraUQak-CN2M_wc6EexLzog56XJ32k",

        // missing pattern rozu
        missingPatterns: "1flz3aTbLTElXd4lp9D41aNjWkwb8Oo2ZXTJqejyqFPE",

        // for the hoseki pattern, the '-katsu' highlight color is '-invalid'
        // for the rozu pattern, the 'ma-' base color is 'invalid-'
        koiTypo: "1gJW64Rb4dGf_FNO6rs9aqpkRRkQZt66e_RY8m7spps8",

        // extra empty row in pattern akachan
        extraRow: "1uEcwgMuqXvg-xWKghocLW4c85NE367aNDBDt0S6oGqE"

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