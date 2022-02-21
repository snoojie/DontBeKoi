const { KoiSpreadsheet, KoiSpreadsheetError } 
    = require("../../src/google/koiSpreadsheet");
const { waitGoogleQuota, googleQuotaTimeout } = require("../_setup/spreadsheet");
const { expectError } = require("../_setup/testUtil");

// wait a minute before starting the tests
// this is because google has a read quota
beforeAll(async() => {
    await waitGoogleQuota();
}, googleQuotaTimeout);

// ===================
// =====GET VALUE=====
// ===================

test("Get value when provided a single cell.", () => {
    const VALUE = KoiSpreadsheet.getValue([ [ "cafe" ] ], 0, 0);
    expect(VALUE).toBe("cafe");
});

test("Get value removes accents.", () => {
    const VALUE = KoiSpreadsheet.getValue([ [ "café" ] ], 0, 0);
    expect(VALUE).toBe("cafe");
});

test("Get value of an empty string.", () => {
    const VALUE = KoiSpreadsheet.getValue([ [ "" ] ], 0, 0);
    expect(VALUE).toBe("");
});

test("Get value when provided several rows and columns.", () => {
    const VALUE = KoiSpreadsheet.getValue(
        [ [ "", "", "not it" ], [ "", "", "Jalapeños are delicious!" ] ], 
        1, 2
    );
    expect(VALUE).toBe("Jalapenos are delicious!");
});

test("Get value when rowIndex out of bounds.", () => {
    const VALUE = KoiSpreadsheet.getValue([ [ "not it" ] ], 3, 0);
    expect(VALUE).toBe("");
});

test("Get value when columnIndex out of bounds.", () => {
    const VALUE = KoiSpreadsheet.getValue([ [ "not it" ] ], 0, 3);
    expect(VALUE).toBe("");
});

test("Get value when table is empty.", () => {
    const VALUE = KoiSpreadsheet.getValue([], 0, 0);
    expect(VALUE).toBe("");
});

// =====================
// =====GET PATTERN=====
// =====================

test("Get pattern.", () => {
    const PATTERN = KoiSpreadsheet.getPattern(
        "somespreadsheetId",
        [ [ "wrong row", "wrong row and column" ], [ "SomePattern", "Wrong column" ] ], 
        1
    );
    expect(PATTERN).toBe("SomePattern");
});

test("Get pattern with accents.", () => {
    const PATTERN = KoiSpreadsheet.getPattern(
        "somespreadsheetId", [ [ "Naïve", "wrong column" ] ], 0
    );
    expect(PATTERN).toBe("Naive");
});

test("Get pattern when row is empty.", () => {
    expectError(
        () => KoiSpreadsheet.getPattern(
            "somespreadsheetId", [ [ "", "wrong column" ] ], 0
        ), 
        KoiSpreadsheetError, 
        "Missing pattern name in row 0, column 0 of spreadsheet somespreadsheetId."
    );
});

test("Get pattern when specifying column.", () => {
    const PATTERN = KoiSpreadsheet.getPattern(
        "somespreadsheetId", [ [ "wrong column", "somepattern" ] ], 0, 1
    );
    expect(PATTERN).toBe("somepattern");
});

// ========================
// =====GET BASE COLOR=====
// ========================

test("Getting base color strips dash.", () => {
    const COLOR = KoiSpreadsheet.getBaseColor(
        "somespreadsheetId",
        [ ["wrong row", "wrong row and column" ], [ "Cha-", "wrong column" ] ], 
        1
    );
    expect(COLOR).toBe("Cha");
});

test("Getting base color removes accents.", () => {
    const COLOR = KoiSpreadsheet.getBaseColor("somespreadsheetId", [ ["Façade" ] ], 0);
    expect(COLOR).toBe("Facade");
});

test("Getting base color when row is empty.", () => {
    expectError(
        () => KoiSpreadsheet.getBaseColor("somespreadsheetId", [ [] ], 1),
        KoiSpreadsheetError,
        "Missing base color name in row 1, column 0 of spreadsheet somespreadsheetId."
    );
});

test("Getting base color when specifying column.", () => {
    const COLOR = KoiSpreadsheet.getBaseColor(
        "somespreadsheetId", [ [ "wrong column", "somecolor" ] ], 0, 1
    );
    expect(COLOR).toBe("somecolor");
});

// =============================
// =====GET HIGHLIGHT COLOR=====
// =============================

test("Getting highlight color strips dash.", () => {
    const COLOR = KoiSpreadsheet.getHighlightColor(
        "somespreadsheetId",
        [ ["wrong row", "wrong row and column" ], [ "-kura", "wrong column" ] ], 
        1, 0
    );
    expect(COLOR).toBe("kura");
});

test("Getting highlight color removes accents.", () => {
    const COLOR = KoiSpreadsheet.getHighlightColor(
        "somespreadsheetId", [ ["Fiancé" ] ], 0, 0
    );
    expect(COLOR).toBe("Fiance");
});

test("Getting highlight color when table is empty.", () => {
    expectError(
        () => KoiSpreadsheet.getHighlightColor("somespreadsheetId", [], 0, 0),
        KoiSpreadsheetError,
        "Missing highlight color name in row 0, " +
        "column 0 of spreadsheet somespreadsheetId."
    );
});