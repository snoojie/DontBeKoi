const { UnknownKoiProgress, KoiSpreadsheetMissingColor, KoiSpreadsheetMissingPattern } 
    = require("../../src/spreadsheets/koiSpreadsheet");
const { InvalidGoogleApiKey, PrivateSpreadsheet, SpreadsheetNotFound, RangeNotFound } 
    = require("../../src/spreadsheets/spreadsheet");
const { ConfigError } = require("../../src/util/config");
const { expectErrorAsync } = require("./testUtil");

const GOOGLE_QUOTA_TIMEOUT = 70000;

const Util = {

    /**
     * Wait a minute before running tests.
     * This is because Google has a quota on read per minute.
     */
    waitGoogleQuota: async function()
    {
        return new Promise(resolve => setTimeout(resolve, GOOGLE_QUOTA_TIMEOUT));
    },

    googleQuotaTimeout: GOOGLE_QUOTA_TIMEOUT+30000,

    spreadsheets: {

        // copy of snooj's
        valid: "1Sed1Z5n8mcfyDj-v4fv5CxiVyg1N0B2qLYpMW6qIhSQ",

        // copy of lucy's
        valid2: "1_V4OmDhHzNDVJ3cbO_XSfYJ54zkjcFab1AT4hOzxvMM",

        // coris's spreadsheet
        community: "1Y717KMb15npzEv3ed2Ln2Ua0ZXejBHyfbk5XL_aZ4Qo",

        // private spreadsheet
        private: "1YzaW_f2ID5qDSAYn4inf_4clb8WpfnletqyYhI6HA7E",

        // both collectors sheets and progressive sheets are renamed
        renamedSheets: "1RFiWTw8PGDsXFYaLbZ0ia6RL45WxmcBXOKTjOqfO784",

        // marked with 'K': progressive shishiro inazuma, 
        //                  collector ryosumi akachan and chashiro okan
        // marked with 'D': progressive kiburu goromo, 
        //                  collector aisumi akachan and chakuro okan
        // marked with '  k  ': progressive kiukon katame, collector gudai oushi
        // marked with '  K  ': collector kuukon akachan
        // marked with '  d  ': collector kudai akachan, collector madai oushi
        // marked with '  D  ': progressive akaukon katame
        // marked with '  ': progressive kipinku shizuku, 
        //                   collector shigin aishite and kodai oushi
        badButValidKoiProgress: "1CtREH8Avhbe9VICV8Gxtz_RQDKX2xN1vq6WvAFnB50w",

        // progressive kudai toraiu marked with 'invalid'
        // progressive kimura katame marked with 'invalid'
        // collector maburu dorama marked with 'kk'
        // collector mausu naisu marked with 'dk'
        invalidKoiProgress: "17SdMbBrTIrq52VttiP2ZuqY5g-mbf7QpCOoffOsvqU4",

        // progressive goromo missing base color Shi
        // collector bunki missing base color Ki
        // collector onmyo has an extra row in its colors
        missingBaseColors: "13FoV6IN4xnyO-7uLMd4OaI8XIhzVcrbJwULtsoK_0W0",

        // progressive meisai missing highlight color buru
        // all collectors a-m have an extra column between common and rares
        // collector roru missing highlight color gure
        missingHighlightColors: "1-vNoPw2GSx1BOJ6Mbb5dWHn2S7B7b-lKPQaGSNS2Qz0",

        // progressive inazuma's base color Aka
        // progressive goromo's common color kuro
        // progressive kujaku's rare color mura
        // collector buta's base ku, common dai, and rare mura
        // collector natsu's base ma
        // collector nezumi common shiro
        // collector nitto rare mosu
        colorsMissingDashes: "1vpyhDXYg6kobqtcmjNLAxdWCxgumc0a5iRXg9UkkrIw",

        // progressive doitsu missing its name
        // collector dokuro has an empty row above its pattern name
        // collector yumi missing its name
        missingPatternNames: "1g-Ihn-7586pz53UqLIbtw7vlmJdu0aux6wnJ9f2Fi4I",

        // missing collectors rozu and hoseki
        // missing progressives supure, bekko, and katame
        missingPatterns: "1flz3aTbLTElXd4lp9D41aNjWkwb8Oo2ZXTJqejyqFPE",

        // for collector hoseki, the '-katsu' highlight color is '-invalid'
        // for collector rozu, the 'ma-' base color is 'invalid-'
        // for progressive supure, the 'ku-' base color is 'invalid'
        koiTypo: "1gJW64Rb4dGf_FNO6rs9aqpkRRkQZt66e_RY8m7spps8"
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
    },

    expectSpreadsheetError: async function(promise, errorType, spreadsheetId, errorInfo)
    {
        await expectErrorAsync(
            promise, 
            errorType,
            `Spreadsheet '${spreadsheetId}' ${errorInfo}.`,
            { info: errorInfo }
        );
    },

    expectSpreadsheetNotFound: async function(promise, spreadsheetId)
    {
        await Util.expectSpreadsheetError(
            promise, SpreadsheetNotFound, spreadsheetId, "does not exist"
        );
    },

    expectPrivateSpreadsheet: async function(promise)
    {
        await Util.expectSpreadsheetError(
            promise, PrivateSpreadsheet, Util.spreadsheets.private, "is private"
        );
    },

    expectRangeNotFound: async function(promise, spreadsheetId, range)
    {
        await Util.expectSpreadsheetError(
            promise, RangeNotFound, spreadsheetId, `does not have range '${range}'`
        );
    },

    expectUnknownKoiProgress: async function(promise, spreadsheetId, type, koi, pattern, value)
    {
        await Util.expectSpreadsheetError(
            promise, 
            UnknownKoiProgress, 
            spreadsheetId, 
            `has ${type.toLowerCase()} ${koi} ${pattern} marked with '${value}' ` +
            `instead of 'k', 'd', or no text`
        );
    },

    expectKoiSpreadsheetMissingPattern: async function(promise, spreadsheetId, sheet, row, column)
    {
        await Util.expectSpreadsheetError(
            promise,
            KoiSpreadsheetMissingPattern,
            spreadsheetId,
            `missing pattern in sheet '${sheet}', row ${row}, column ${column}`
        );
    },

    expectKoiSpreadsheetMissingColor: async function(promise, spreadsheetId, type, pattern, row, column)
    {
        await Util.expectSpreadsheetError(
            promise,
            KoiSpreadsheetMissingColor,
            spreadsheetId,
            `missing color for ${type.toLowerCase()} ${pattern} in ` +
            `row ${row}, column ${column}`
        );
    }
};

module.exports = Util;