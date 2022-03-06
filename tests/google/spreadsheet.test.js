const { Spreadsheet, InvalidSpreadsheetColumn } 
    = require("../../src/spreadsheets/spreadsheet");
const { waitGoogleQuota, googleQuotaTimeout, testWithModifiedEnv, spreadsheets, 
        expectPrivateSpreadsheet, expectSpreadsheetNotFound, expectRangeNotFound } 
    = require("../_setup/spreadsheet");
const { expectErrorAsync, expectError } = require("../_setup/testUtil");
const { google } = require("googleapis");

// this is the community spreadsheet
const VALID_RANGE = "Progressives!I16";

// wait a minute before starting the tests
// this is because google has a read quota
beforeAll(async() => {
    await waitGoogleQuota();
}, googleQuotaTimeout);

// ==================
// =====VALIDATE=====
// ==================

testWithModifiedEnv(
    "Validate", async () => Spreadsheet.validate(spreadsheets.valid)
);

test("Validate non existant spreadsheet.", async() => {
    await expectSpreadsheetNotFound(Spreadsheet.validate("invalidid"), "invalidid");
});

test("Validate private spreadsheet.", async() => {
    await expectPrivateSpreadsheet(Spreadsheet.validate(spreadsheets.private));
});

describe("Modify Google API for validate tests.", () => {

    const ORIGINAL_GOOGLE_API = google.sheets;
    afterAll(() => google.sheets = ORIGINAL_GOOGLE_API);
    
    test("Error calling Google API.", async() => {
        google.sheets = jest.fn(() => { 
            return {
                spreadsheets: {
                    get: async() => { throw new Error("some error"); }
                }
            };
        });
        let promise = Spreadsheet.validate(spreadsheets.valid);
        await expectErrorAsync(promise, Error, "some error");
    });
});

test("Validate valid spreadsheet.", async() => {
    const IS_VALID = await Spreadsheet.validate(spreadsheets.valid);
    expect(IS_VALID).toBeTruthy();
});

// ====================
// =====GET VALUES=====
// ====================

testWithModifiedEnv(
    "Get values", async () => Spreadsheet.getValues(spreadsheets.valid, VALID_RANGE)
);

test("Get values of non existant spreadsheet.", async() => {
    await expectSpreadsheetNotFound(
        Spreadsheet.getValues("invalidid", VALID_RANGE), "invalidid"
    );
});

test("Get values of private spreadsheet.", async() => {
    await expectPrivateSpreadsheet(
        Spreadsheet.getValues(spreadsheets.private, VALID_RANGE)
    );
});

describe("Modify Google API for get values tests.", () => {

    const ORIGINAL_GOOGLE_API = google.sheets;
    afterAll(() => google.sheets = ORIGINAL_GOOGLE_API);
    
    test("Error calling Google API.", async() => {
        google.sheets = jest.fn(() => { 
            return {
                spreadsheets: {
                    values: {
                        get: async() => { throw new Error("some error"); }
                    }
                }
            };
        });
        let promise = Spreadsheet.getValues(spreadsheets.valid, VALID_RANGE);
        await expectErrorAsync(promise, Error, "some error");
    });
});

test("Get values of invalid range.", async() => {
    await expectRangeNotFound(
        Spreadsheet.getValues(spreadsheets.valid, "invalidrange"),
        spreadsheets.valid,
        "invalidrange"
    );
});

test("Get value of single string cell.", async() => {
    const VALUES = 
        await Spreadsheet.getValues(spreadsheets.valid, "Progressives!I16");
    expect(VALUES).toEqual([ [ "Goten" ] ]);
});

test("Get value of single number cell.", async() => {
    const VALUES = 
        await Spreadsheet.getValues(spreadsheets.valid, "A-M: Collectors!D2");
    expect(VALUES).toEqual([ [ "7" ] ]);
});

test("Get value of single empty cell.", async() => {
    const VALUES = 
        await Spreadsheet.getValues(spreadsheets.valid, "N-Z: Collectors!A1");
    expect(VALUES).toEqual([]);
});

test("Get values of row with strings.", async() => {
    const VALUES = 
        await Spreadsheet.getValues(spreadsheets.valid, "Overview!B3:D3");
    expect(VALUES).toEqual([ [ "Type", "Collection started", "Common Koi" ] ]);
});

test("Get values of row with mixed types.", async() => {
    const VALUES = 
        await Spreadsheet.getValues(spreadsheets.valid, "Progressives!A9:I9");
    expect(VALUES).toEqual([ [ "Meisai", "y", "16", "7", "0", "0", "21", "", "Nidan" ] ]);
});

test("Get values of empty row.", async() => {
    const VALUES = 
        await Spreadsheet.getValues(spreadsheets.valid, "A-M: Collectors!A8:C8");
    expect(VALUES).toEqual([]);
});

test("Get values of several rows.", async() => {
    const VALUES = 
        await Spreadsheet.getValues(spreadsheets.valid, "Progressives!AE23:AG25");
    expect(VALUES).toEqual([ [ "Doitsu" ], [ "", "-shiro", "-ukon" ], [ "Shi-" ] ]);
});

test("Get values of several rows with middle empty.", async() => {
    const VALUES = 
        await Spreadsheet.getValues(spreadsheets.valid, "Progressives!I7:I9");
    expect(VALUES).toEqual([ [ "Ku-" ], [], [ "Nidan" ] ]);
});

test("Get values of several rows with last row empty.", async() => {
    const VALUES = 
        await Spreadsheet.getValues(spreadsheets.valid, "Progressives!I7:I8");
    expect(VALUES).toEqual([ [ "Ku-" ] ]);
});

// ========================================
// =====CONVERT COLUMN INDEX TO LETTER=====
// ========================================

test("Column A.", () => {
    const COLUMN = Spreadsheet.convertColumnIndexToLetter(0);
    expect(COLUMN).toBe("A");
});


test("Column I.", () => {
    const COLUMN = Spreadsheet.convertColumnIndexToLetter(8);
    expect(COLUMN).toBe("I");
});

test("Column AA.", () => {
    const COLUMN = Spreadsheet.convertColumnIndexToLetter(26);
    expect(COLUMN).toBe("AA");
});

test("Column BI.", () => {
    const COLUMN = Spreadsheet.convertColumnIndexToLetter(60);
    expect(COLUMN).toBe("BI");
});

test("Invalid column.", () => {
    expectError(
        () => Spreadsheet.convertColumnIndexToLetter(-1),
        InvalidSpreadsheetColumn,
        "Invalid column index: -1. It must be at least 0."
    );
});