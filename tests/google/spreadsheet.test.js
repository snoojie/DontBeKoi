const { Spreadsheet, InvalidSpreadsheet, RangeNotFound } 
    = require("../../src/google/spreadsheet");
const { waitGoogleQuota, googleQuotaTimeout, testWithModifiedEnv, spreadsheets } 
    = require("../_setup/spreadsheet");
const { expectErrorAsync } = require("../_setup/testUtil");

// this is the community spreadsheet
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
    "Check if spreadsheet exists", async () => Spreadsheet.exists(spreadsheets.community)
)

test("Valid spreadsheet exists.", async() => {
    const EXISTS = await Spreadsheet.exists(spreadsheets.community);
    expect(EXISTS).toBeTruthy();
});

test("Invalid spreadsheet does not exist.", async() => {
    const EXISTS = await Spreadsheet.exists("invalidspreadsheet");
    expect(EXISTS).toBeFalsy();
});

// ====================
// =====GET VALUES=====
// ====================

testWithModifiedEnv(
    "Get values", async () => Spreadsheet.getValues(spreadsheets.community, VALID_RANGE)
)

test("Get values of invalid spreadsheet.", async() => {
    let promise = Spreadsheet.getValues("invalidid", VALID_RANGE);
    await expectErrorAsync(
        promise, 
        InvalidSpreadsheet,
        "Spreadsheet ID 'invalidid' does not exist."
    );
});

test("Get values of invalid range.", async() => {
    let promise = Spreadsheet.getValues(spreadsheets.community, "invalidrange");
    await expectErrorAsync(
        promise, 
        RangeNotFound,
        `Spreadsheet ID '${spreadsheets.community}' does not have range 'invalidrange'.`
    );
});

test("Get value of single string cell.", async() => {
    const VALUES = 
        await Spreadsheet.getValues(spreadsheets.community, "Progressives!I16");
    expect(VALUES).toEqual([ [ "Goten" ] ]);
});

test("Get value of single number cell.", async() => {
    const VALUES = 
        await Spreadsheet.getValues(spreadsheets.community, "A-M: Collectors!D2");
    expect(VALUES).toEqual([ [ "0" ] ]);
});

test("Get value of single empty cell.", async() => {
    const VALUES = 
        await Spreadsheet.getValues(spreadsheets.community, "N-Z: Collectors!A1");
    expect(VALUES).toEqual([]);
});

test("Get values of row with strings.", async() => {
    const VALUES = 
        await Spreadsheet.getValues(spreadsheets.community, "Overview!B3:D3");
    expect(VALUES).toEqual([ [ "Type", "Collection started", "Common Koi" ] ]);
});

test("Get values of row with mixed types.", async() => {
    const VALUES = 
        await Spreadsheet.getValues(spreadsheets.community, "Progressives!A9:I9");
    expect(VALUES).toEqual([ [ "Meisai", "n", "0", "0", "0", "0", "21", "", "Nidan" ] ]);
});

test("Get values of empty row.", async() => {
    const VALUES = 
        await Spreadsheet.getValues(spreadsheets.community, "A-M: Collectors!A8:C8");
    expect(VALUES).toEqual([]);
});

test("Get values of several rows.", async() => {
    const VALUES = 
        await Spreadsheet.getValues(spreadsheets.community, "Progressives!I2:K4");
    expect(VALUES).toEqual([ [ "Inazuma" ], [ "", "-shiro", "-ukon" ], [ "Shi-" ] ]);
});

test("Get values of several rows with middle empty.", async() => {
    const VALUES = 
        await Spreadsheet.getValues(spreadsheets.community, "Progressives!I7:I9");
    expect(VALUES).toEqual([ [ "Ku-" ], [], [ "Nidan" ] ]);
});

test("Get values of several rows with last row empty.", async() => {
    const VALUES = 
        await Spreadsheet.getValues(spreadsheets.community, "Progressives!I7:I8");
    expect(VALUES).toEqual([ [ "Ku-" ] ]);
});