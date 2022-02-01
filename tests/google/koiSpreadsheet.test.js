const KoiSpreadsheet = require("../../src/google/koiSpreadsheet").default;

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