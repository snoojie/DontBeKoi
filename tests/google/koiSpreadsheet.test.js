const KoiSpreadsheet = require("../../src/google/koiSpreadsheet").default;

// ==============================
// =====GET STRING FROM CELL=====
// ==============================

test("Can get string from cell.", () => {
    const VALUE = KoiSpreadsheet.getStringFromCell(
        [ ["one", "two"], ["three", "four"] ],
        1,
        1
    );
    expect(VALUE).toBe("four");
});

test("Getting string from empty table yields empty string.", () => {
    const VALUE = KoiSpreadsheet.getStringFromCell(
        [], 1, 1
    );
    expect(VALUE).toBe("");
});

test("Getting string when table has empty string yields empty string.", () => {
    const VALUE = KoiSpreadsheet.getStringFromCell(
        [ ["one", "", "three" ] ], 0, 1
    );
    expect(VALUE).toBe("");
});

// ==============================
// =====GET PATTERN FROM ROW=====
// ==============================

test("Getting pattern returns string at (row, 0).", () => {
    const PATTERN = KoiSpreadsheet.getPatternNameFromRow(
        [ ["wrong row"], ["somepattern", "not a pattern"] ],
        1,
    );
    expect(PATTERN).toBe("somepattern");
});

test("Getting pattern from empty table returns empty string.", () => {
    const PATTERN = KoiSpreadsheet.getPatternNameFromRow([], 0,);
    expect(PATTERN).toBe("");
});

// =================================
// =====GET BASE COLOR FROM ROW=====
// =================================

test("Getting base color strips dash.", () => {
    const COLOR = KoiSpreadsheet.getBaseColorFromRow(
        [ ["wrong row"], ["Cha-", "not a color"] ],
        1,
    );
    expect(COLOR).toBe("Cha");
});

test(
    "Getting base color returns the color even when the table does not have the dash.", 
    () => 
{
    const COLOR = KoiSpreadsheet.getBaseColorFromRow(
        [ ["wrong row"], ["Cha", "not a color"] ],
        1,
    );
    expect(COLOR).toBe("Cha");
});

test("Getting base color from empty table yields empty string.", () => {
    const COLOR = KoiSpreadsheet.getBaseColorFromRow([], 0);
    expect(COLOR).toBe("");
});

// =========================================
// =====GET HIGHLIGHT COLOR FROM COLUMN=====
// =========================================

test("Getting highlight color strips dash.", () => {
    const COLOR = KoiSpreadsheet.getHighlightColorFromColumn(
        [ ["wrong row"], ["wrong column", "-kura"] ],
        1,
        1
    );
    expect(COLOR).toBe("kura");
});

test(
    "Getting highlight color returns the color even when the table " +
    "does not have the dash.", 
    () => 
{
    const COLOR = KoiSpreadsheet.getHighlightColorFromColumn(
        [ ["wrong row"], ["wrong column", "kura"] ],
        1,
        1
    );
    expect(COLOR).toBe("kura");
});

test("Getting highlight color from empty table yields empty string.", () => {
    const COLOR = KoiSpreadsheet.getHighlightColorFromColumn([], 0, 0);
    expect(COLOR).toBe("");
});