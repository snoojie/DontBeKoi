const { SpreadsheetNotFound, PrivateSpreadsheet, RangeNotFound } 
    = require("../../src/google/spreadsheet");
const { UserSpreadsheet, PatternNotInSpreadsheet, KoiNotInSpreadsheet,
        UnknownKoiProgress
      } = require("../../src/google/userSpreadsheet");
const { waitGoogleQuota, googleQuotaTimeout, testWithModifiedEnv, spreadsheets } 
    = require("../_setup/spreadsheet");
const { expectErrorAsync } = require("../_setup/testUtil");

// wait a minute before starting the tests
// this is because google has a read quota
beforeAll(async() => {
    await waitGoogleQuota();
}, googleQuotaTimeout);

// ================
// =====ERRORS=====
// ================

testWithModifiedEnv(
    "Has koi", 
    async () => UserSpreadsheet.hasKoi(spreadsheets.valid, "shigin", "aishite")
)

test("User missing pattern.", async() => {
    await expectErrorAsync(
        UserSpreadsheet.hasKoi(spreadsheets.valid, "shigin", "invalidpattern"), 
        PatternNotInSpreadsheet, 
        `Spreadsheet '${spreadsheets.valid}' missing pattern 'invalidpattern'.`
    );
});

test("User missing base color.", async() => {
    await expectErrorAsync(
        UserSpreadsheet.hasKoi(spreadsheets.valid, "invalidcolor", "natsu"), 
        KoiNotInSpreadsheet, 
        `Spreadsheet '${spreadsheets.valid}' missing koi 'invalidcolor' ` +
        "for pattern 'natsu'."
    );
});

test("User missing highlight color.", async() => {
    await expectErrorAsync(
        UserSpreadsheet.hasKoi(spreadsheets.valid, "neinvalid", "robotto"), 
        KoiNotInSpreadsheet, 
        `Spreadsheet '${spreadsheets.valid}' missing koi 'neinvalid' ` +
        "for pattern 'robotto'."
    );
});

test("User missing color even though base and highlight are correct.", async() => {
    await expectErrorAsync(
        UserSpreadsheet.hasKoi(spreadsheets.valid, "seiinvalidkoji", "toransu"), 
        KoiNotInSpreadsheet,
        `Spreadsheet '${spreadsheets.valid}' missing koi 'seiinvalidkoji' ` +
        "for pattern 'toransu'."
    );
});

test("Spreadsheet does not exist.", async() => {
    await expectErrorAsync(
        UserSpreadsheet.hasKoi("invalidspreadsheet", "shigin", "natsu"), 
        SpreadsheetNotFound, 
        "Spreadsheet ID 'invalidspreadsheet' does not exist."
    );
});

test("Private spreadsheet.", async() => {
    await expectErrorAsync(
        UserSpreadsheet.hasKoi(
            spreadsheets.private, "shigin", "natsu"
        ), 
        PrivateSpreadsheet, 
        `Spreadsheet ID '${spreadsheets.private}' is private.`
    );
});

test("Spreadsheet with renamed sheets.", async() => {
    await expectErrorAsync(
        UserSpreadsheet.hasKoi(
            spreadsheets.renamedSheets, "mapapu", "aishite"
        ), 
        RangeNotFound, 
        `Spreadsheet ID '${spreadsheets.renamedSheets}' does not have range ` +
        "'A-M: Collectors!B2:K'"
    );
});

test("Koi marked with neither k or d.", async() => {
    await expectErrorAsync(
        UserSpreadsheet.hasKoi(spreadsheets.badKoiProgressMarks, "ryodai", "akachan"), 
        UnknownKoiProgress, 
        `Spreadsheet '${spreadsheets.badKoiProgressMarks}' has koi ` +
        "'ryodai akachan' marked with 'invalid'. Expected to see 'k', 'd', or no text."
    );
});

// =======================
// =====SUCCESS CALLS=====
// =======================

test("Has common koi.", async() => {
    const HAS_KOI = await UserSpreadsheet.hasKoi(spreadsheets.valid, "seidai", "aishite");
    expect(HAS_KOI).toBeTruthy();
});

test("Does not have common koi.", async() => {
    const HAS_KOI = await UserSpreadsheet.hasKoi(spreadsheets.valid, "nekoji", "botan");
    expect(HAS_KOI).toBeFalsy();
});

test("Has rare koi.", async() => {
    const HAS_KOI = await UserSpreadsheet.hasKoi(spreadsheets.valid, "mumosu", "mebaeru");
    expect(HAS_KOI).toBeTruthy();
});

test("Does not have rare koi.", async() => {
    const HAS_KOI = await UserSpreadsheet.hasKoi(spreadsheets.valid, "mapinku", "naisu");
    expect(HAS_KOI).toBeFalsy();
});

test("Has dragonned koi.", async() => {
    const HAS_KOI = await UserSpreadsheet.hasKoi(spreadsheets.valid2, "nekuro", "ondori");
    expect(HAS_KOI).toBeTruthy();
});

test("Has koi even when it marked with capital K.", async() => {
    const HAS_KOI = await UserSpreadsheet
        .hasKoi(spreadsheets.badKoiProgressMarks, "ryopinku", "akachan");
    expect(HAS_KOI).toBeTruthy();
});

test("Has koi even when it marked with capital D.", async() => {
    const HAS_KOI = await UserSpreadsheet
        .hasKoi(spreadsheets.badKoiProgressMarks, "ryosumi", "akachan");
    expect(HAS_KOI).toBeTruthy();
});

test("Has koi even when there are spaces around k.", async() => {
    const HAS_KOI = await UserSpreadsheet
        .hasKoi(spreadsheets.badKoiProgressMarks, "kudai", "akachan");
    expect(HAS_KOI).toBeTruthy();
});

test("Has koi even when there are spaces around d.", async() => {
    const HAS_KOI = await UserSpreadsheet
        .hasKoi(spreadsheets.badKoiProgressMarks, "kupinku", "akachan");
    expect(HAS_KOI).toBeTruthy();
});

test("Does not have koi when text is just spaces.", async() => {
    const HAS_KOI = await UserSpreadsheet
        .hasKoi(spreadsheets.badKoiProgressMarks, "ryoukon", "akachan");
    expect(HAS_KOI).toBeFalsy();
})

test("Color is case insenstive.", async() => {
    const HAS_KOI = 
        await UserSpreadsheet.hasKoi(spreadsheets.valid, "nEDAi", "hanabi");  
    expect(HAS_KOI).toBeTruthy();

    const HAS_KOI2 = 
        await UserSpreadsheet.hasKoi(spreadsheets.valid, "NEUSU", "hanabi");
    expect(HAS_KOI2).toBeFalsy();
});

test("Pattern is case insenstive.", async() => {
    const HAS_KOI = 
        await UserSpreadsheet.hasKoi(spreadsheets.valid, "nekuro", "HYOGEN");
    expect(HAS_KOI).toBeTruthy();

    const HAS_KOI2 = 
        await UserSpreadsheet.hasKoi(spreadsheets.valid, "kikatsu", "hyoGEn");
    expect(HAS_KOI2).toBeFalsy();
});