const { KoiSpreadsheet, KoiSpreadsheetError } 
    = require("../../src/google/koiSpreadsheet");
const { waitGoogleQuota, googleQuotaTimeout } = require("../_setup/spreadsheet");
const { expectError } = require("../_setup/testUtil");

// wait a minute before starting the tests
// this is because google has a read quota
beforeAll(async() => {
    await waitGoogleQuota();
}, googleQuotaTimeout);

// ========================
// =====NORMALIZE CELL=====
// ========================

test("Normalize when provided a single cell.", () => {
    const VALUE = KoiSpreadsheet.normalizeCell([ [ "café" ] ], 0, 0);
    expect(VALUE).toBe("cafe");
});

test("Normalize when provided a cell without accents.", () => {
    const VALUE = KoiSpreadsheet.normalizeCell([ [ "cafe" ] ], 0, 0);
    expect(VALUE).toBe("cafe");
});

test("Normalize empty string.", () => {
    const VALUE = KoiSpreadsheet.normalizeCell([ [ "" ] ], 0, 0);
    expect(VALUE).toBe("");
});

test("Normalize when provided several rows and columns.", () => {
    const VALUE = KoiSpreadsheet.normalizeCell(
        [ [ "", "", "not it" ], [ "", "", "Jalapeños are delicious!" ] ], 
        1, 2
    );
    expect(VALUE).toBe("Jalapenos are delicious!");
});

test("Normalize when rowIndex out of bounds.", () => {
    const VALUE = KoiSpreadsheet.normalizeCell([ [ "not it" ] ], 3, 0);
    expect(VALUE).toBe("");
});

test("Normalize when columnIndex out of bounds.", () => {
    const VALUE = KoiSpreadsheet.normalizeCell([ [ "not it" ] ], 0, 3);
    expect(VALUE).toBe("");
});

test("Normalize when table is empty.", () => {
    const VALUE = KoiSpreadsheet.normalizeCell([], 0, 0);
    expect(VALUE).toBe("");
});

// =====================
// =====GET PATTERN=====
// =====================

test("Get pattern.", () => {
    const PATTERN = KoiSpreadsheet.getPattern(
        [ [ "wrong row", "wrong row and column" ], [ "SomePattern", "Wrong column" ] ], 
        1
    );
    expect(PATTERN).toBe("SomePattern");
});

test("Get pattern with accents.", () => {
    const PATTERN = KoiSpreadsheet.getPattern([ [ "Naïve", "wrong column" ] ], 0);
    expect(PATTERN).toBe("Naive");
});

test("Get pattern when row is empty.", () => {
    expectError(
        () => KoiSpreadsheet.getPattern([ [ "", "wrong column" ] ], 0), 
        KoiSpreadsheetError, 
        "Missing pattern name in row 0."
    );
});

// ========================
// =====GET BASE COLOR=====
// ========================

test("Getting base color strips dash.", () => {
    const COLOR = KoiSpreadsheet.getBaseColor(
        [ ["wrong row", "wrong row and column" ], [ "Cha-", "wrong column" ] ], 
        1
    );
    expect(COLOR).toBe("Cha");
});

test("Getting base color removes accents.", () => {
    const COLOR = KoiSpreadsheet.getBaseColor([ ["Façade" ] ], 0);
    expect(COLOR).toBe("Facade");
});

test("Getting base color when row is empty.", () => {
    expectError(
        () => KoiSpreadsheet.getBaseColor([ [] ], 1),
        KoiSpreadsheetError,
        "Missing base color name in row 1."
    );
});

// =============================
// =====GET HIGHLIGHT COLOR=====
// =============================

test("Getting highlight color strips dash.", () => {
    const COLOR = KoiSpreadsheet.getHighlightColor(
        [ ["wrong row", "wrong row and column" ], [ "-kura", "wrong column" ] ], 
        1, 0
    );
    expect(COLOR).toBe("kura");
});

test("Getting highlight color removes accents.", () => {
    const COLOR = KoiSpreadsheet.getHighlightColor([ ["Fiancé" ] ], 0, 0);
    expect(COLOR).toBe("Fiance");
});

test("Getting highlight color when table is empty.", () => {
    expectError(
        () => KoiSpreadsheet.getHighlightColor([], 0, 0),
        KoiSpreadsheetError,
        "Missing highlight color name in row 0, column 0."
    );
});