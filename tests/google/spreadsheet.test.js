const { Spreadsheet, SpreadsheetError } = require("../../src/google/spreadsheet");
const { ConfigError } = require("../../src/util/config");
const ErrorMessages = require("../../src/errorMessages").default;
const { waitGoogleQuota, googleQuotaTimeout } = require("../_setup/spreadsheet");
const { expectErrorAsync } = require("../_setup/testUtil");

// this is the community spreadsheet
const VALID_SPREADSHEET_ID = "1Y717KMb15npzEv3ed2Ln2Ua0ZXejBHyfbk5XL_aZ4Qo";
const VALID_RANGE = "Progressives!I16";

// wait a minute before starting the tests
// this is because google has a read quota
beforeAll(async() => {
    await waitGoogleQuota();
}, googleQuotaTimeout);

// ================
// =====EXISTS=====
// ================

testWithModifiedEnv(
    "Check if spreadsheet exists", 
    async () => Spreadsheet.exists(VALID_SPREADSHEET_ID),
    `Could not check if the spreadsheet '${VALID_SPREADSHEET_ID}' exists. ` +
    "Could the Google API key be invalid?"
)

test("Valid spreadsheet exists.", async() => {
    const EXISTS = await Spreadsheet.exists(VALID_SPREADSHEET_ID);
    expect(EXISTS).toBeTruthy();
});

test("Invalid spreadshet does not exist.", async() => {
    const EXISTS = await Spreadsheet.exists("invalidspreadsheet");
    expect(EXISTS).toBeFalsy();
});

// ====================
// =====GET VALUES=====
// ====================

testWithModifiedEnv(
    "Get values", 
    async () => Spreadsheet.getValues(VALID_SPREADSHEET_ID, VALID_RANGE),
    getValuesSpreadsheetErrorMessage(VALID_SPREADSHEET_ID, VALID_RANGE)
)

test("Get values of invalid spreadsheet.", async() => {
    let promise = Spreadsheet.getValues("invalidid", VALID_RANGE);
    await expectErrorAsync(
        promise, 
        SpreadsheetError,
        getValuesSpreadsheetErrorMessage("invalidid", VALID_RANGE)
    );
});

test("Get values of invalid range.", async() => {
    let promise = Spreadsheet.getValues(VALID_SPREADSHEET_ID, "invalidrange");
    await expectErrorAsync(
        promise, 
        SpreadsheetError,
        getValuesSpreadsheetErrorMessage(VALID_SPREADSHEET_ID, "invalidrange")
    );
});

test("Get value of single string cell.", async() => {
    const VALUES = await Spreadsheet.getValues(VALID_SPREADSHEET_ID, "Progressives!I16");
    expect(VALUES).toEqual([ [ "Goten" ] ]);
});

test("Get value of single number cell.", async() => {
    const VALUES = 
        await Spreadsheet.getValues(VALID_SPREADSHEET_ID, "A-M: Collectors!D2");
    expect(VALUES).toEqual([ [ "0" ] ]);
});

test("Get value of single empty cell.", async() => {
    const VALUES = 
        await Spreadsheet.getValues(VALID_SPREADSHEET_ID, "N-Z: Collectors!A1");
    expect(VALUES).toEqual([]);
});

test("Get values of row with strings.", async() => {
    const VALUES = 
        await Spreadsheet.getValues(VALID_SPREADSHEET_ID, "Overview!B3:D3");
    expect(VALUES).toEqual([ [ "Type", "Collection started", "Common Koi" ] ]);
});

test("Get values of row with mixed types.", async() => {
    const VALUES = 
        await Spreadsheet.getValues(VALID_SPREADSHEET_ID, "Progressives!A9:I9");
    expect(VALUES).toEqual([ [ "Meisai", "n", "0", "0", "0", "0", "21", "", "Nidan" ] ]);
});

test("Get values of empty row.", async() => {
    const VALUES = 
        await Spreadsheet.getValues(VALID_SPREADSHEET_ID, "A-M: Collectors!A8:C8");
    expect(VALUES).toEqual([]);
});

test("Get values of several rows.", async() => {
    const VALUES = 
        await Spreadsheet.getValues(VALID_SPREADSHEET_ID, "Progressives!I2:K4");
    expect(VALUES).toEqual([ [ "Inazuma" ], [ "", "-shiro", "-ukon" ], [ "Shi-" ] ]);
});

test("Get values of several rows with middle empty.", async() => {
    const VALUES = 
        await Spreadsheet.getValues(VALID_SPREADSHEET_ID, "Progressives!I7:I9");
    expect(VALUES).toEqual([ [ "Ku-" ], [], [ "Nidan" ] ]);
});

test("Get values of several rows with last row empty.", async() => {
    const VALUES = 
        await Spreadsheet.getValues(VALID_SPREADSHEET_ID, "Progressives!I7:I8");
    expect(VALUES).toEqual([ [ "Ku-" ] ]);
});

function getValuesSpreadsheetErrorMessage(spreadsheetId, range)
{
    `Could not get range '${range}' at spreadsheet '${spreadsheetId}'. ` +
    "Could the spreadsheet ID, range, or Google API key be invalid?"
}

function testWithModifiedEnv(description, methodToTest, spreadsheetErrorMessage)
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