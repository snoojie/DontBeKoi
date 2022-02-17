const { Spreadsheet, SpreadsheetError } = require("../../src/google/spreadsheet");
const { ConfigError } = require("../../src/util/config");
const ErrorMessages = require("../../src/errorMessages").default;
const { waitGoogleQuota, googleQuotaTimeout } = require("../_setup/spreadsheet");
const { expectErrorAsync } = require("../_setup/testUtil");

// this is the community spreadsheet
const VALID_SPREADSHEET_ID = "1Y717KMb15npzEv3ed2Ln2Ua0ZXejBHyfbk5XL_aZ4Qo";
const VALID_RANGE = "Progressives!I16";

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
/*


const VALID_RANGE = "Progressives!I2:K4";

const ORIGINAL_ENV = process.env;

// wait a minute before starting the tests
// this is because google has a read quota
beforeAll(async() => {
    await waitGoogleQuota();
}, googleQuotaTimeout + 30000);


// ====================
// =====GET VALUES=====
// ====================

    test(
        "Error getting values without a Google API key even with valid spreadsheet " + 
        "ID and range.", 
        async() => 
    {
        await expect(Spreadsheet.getValues(VALID_SPREADSHEET_ID, VALID_RANGE))
            .rejects.toThrow(ErrorMessages.CONFIG.MISSING_ENVIRONMENT_VARIABLE);
    });

    test("Error getting values with an invalid Google API key even with valid spreadsheet ID and range.", async() => 
    {
        process.env.GOOGLE_API_KEY = "fake";
        await expect(Spreadsheet.getValues(VALID_SPREADSHEET_ID, VALID_RANGE))
            .rejects.toThrow(ErrorMessages.SPREADSHEET.CANNOT_GET_SPREADSHEET);
    });

});

test("Error getting values of invalid spreadsheet.", async() => {
    await expect(Spreadsheet.getValues("fakeid", "fakerange"))
        .rejects.toThrow(ErrorMessages.SPREADSHEET.CANNOT_GET_SPREADSHEET);
});

test("Error getting values of invalid range.", async() => {
    await expect(Spreadsheet.getValues(VALID_SPREADSHEET_ID, "fakerange"))
        .rejects.toThrow(ErrorMessages.SPREADSHEET.CANNOT_GET_SPREADSHEET);
});

test("Can get all values of rows with text.", async() => {
    const VALUES = await Spreadsheet.getValues(VALID_SPREADSHEET_ID, VALID_RANGE);
    expect(VALUES).toStrictEqual([
        ["Inazuma"],
        ["", "-shiro", "-ukon"],
        ["Shi-"]
    ]);
});

test("Getting values where first row has no text includes that empty row.", async() => {
    const VALUES = 
        await Spreadsheet.getValues(VALID_SPREADSHEET_ID, "Progressives!L2:M3");
    expect(VALUES).toStrictEqual([
        [],
        ["-dai", "-kuro"]
    ]);
});

test("Getting values where last row has no text excludes that last row.", async() => {
    const VALUES = 
        await Spreadsheet.getValues(VALID_SPREADSHEET_ID, "Progressives!K3:L4");
    expect(VALUES).toStrictEqual([
        ["-ukon", "-dai"]
    ]);
});

test("Getting values when there is no text returns an empty list.", async() => {
    const VALUES = 
        await Spreadsheet.getValues(VALID_SPREADSHEET_ID, "Progressives!K4:L5");
    expect(VALUES).toStrictEqual([]);
});

test("Can get value of one cell, with text, with range !<cell>:<cell>.", async() => {
    const VALUES = 
        await Spreadsheet.getValues(VALID_SPREADSHEET_ID, "Progressives!I2:I2");
    expect(VALUES).toStrictEqual([["Inazuma"]]);
});

test("Can get value of one cell, with text, with range !<cell>.", async() => {
    const VALUES = await Spreadsheet.getValues(VALID_SPREADSHEET_ID, "Progressives!I2");
    expect(VALUES).toStrictEqual([["Inazuma"]]);
});

test(
    "Getting value of one cell, without text, with range !<cell>:<cell>, returns " +
    "an empty list.", 
    async() => 
{
    const VALUES = await Spreadsheet.getValues(VALID_SPREADSHEET_ID, "Progressives!L5:L5");
    expect(VALUES).toStrictEqual([]);
});

test(
    "Getting value of one cell, without text, with range !<cell>, " + 
    "returns an empty list.", 
    async() => 
{
    const VALUES = await Spreadsheet.getValues(VALID_SPREADSHEET_ID, "Progressives!J2");
    expect(VALUES).toStrictEqual([]);
});*/