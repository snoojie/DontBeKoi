const { SpreadsheetNotFound, PrivateSpreadsheet, RangeNotFound } 
    = require("../../src/google/spreadsheet");
const { UserSpreadsheet, UserSpreadsheetMissingKoi, UserSpreadsheetMissingPattern }
    = require("../../src/google/userSpreadsheet");
const { KoiSpreadsheetMissingPattern, KoiSpreadsheetMissingColor, UnknownKoiProgress }
    = require("../../src/google/koiSpreadsheet");
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
    async () => 
        UserSpreadsheet.hasKoi(spreadsheets.valid, "shigin", "aishite", "Collector")
)

test("User missing pattern.", async() => {
    await expectErrorAsync(
        UserSpreadsheet
            .hasKoi(spreadsheets.valid, "shigin", "invalidpattern", "Collector"), 
        UserSpreadsheetMissingPattern, 
        `Spreadsheet '${spreadsheets.valid}' missing pattern 'invalidpattern'.`
    );
});

test("User missing base color.", async() => {
    await expectErrorAsync(
        UserSpreadsheet.hasKoi(spreadsheets.valid, "invalidcolor", "natsu", "Collector"), 
        UserSpreadsheetMissingKoi, 
        `Spreadsheet '${spreadsheets.valid}' missing koi 'invalidcolor' ` +
        "for pattern 'natsu'."
    );
});

test("User missing highlight color.", async() => {
    await expectErrorAsync(
        UserSpreadsheet.hasKoi(spreadsheets.valid, "neinvalid", "robotto", "Collector"), 
        UserSpreadsheetMissingKoi, 
        `Spreadsheet '${spreadsheets.valid}' missing koi 'neinvalid' ` +
        "for pattern 'robotto'."
    );
});

test("User missing color even though base and highlight are correct.", async() => {
    await expectErrorAsync(
        UserSpreadsheet
            .hasKoi(spreadsheets.valid, "seiinvalidkoji", "toransu", "Collector"), 
            UserSpreadsheetMissingKoi,
        `Spreadsheet '${spreadsheets.valid}' missing koi 'seiinvalidkoji' ` +
        "for pattern 'toransu'."
    );
});

test("Spreadsheet does not exist.", async() => {
    await expectErrorAsync(
        UserSpreadsheet.hasKoi("invalidspreadsheet", "shigin", "natsu", "Collector"), 
        SpreadsheetNotFound, 
        "Spreadsheet ID 'invalidspreadsheet' does not exist."
    );
});

test("Private spreadsheet.", async() => {
    await expectErrorAsync(
        UserSpreadsheet.hasKoi(
            spreadsheets.private, "shigin", "natsu", "Collector"
        ), 
        PrivateSpreadsheet, 
        `Spreadsheet ID '${spreadsheets.private}' is private.`
    );
});

test("Spreadsheet with renamed sheets.", async() => {
    await expectErrorAsync(
        UserSpreadsheet.hasKoi(
            spreadsheets.renamedSheets, "mapapu", "aishite", "Collector"
        ), 
        RangeNotFound, 
        `Spreadsheet ID '${spreadsheets.renamedSheets}' does not have range ` +
        "'A-M: Collectors!B2:K'"
    );
});

test("Koi marked with neither k or d.", async() => {
    await expectErrorAsync(
        UserSpreadsheet
            .hasKoi(spreadsheets.invalidKoiProgress, "maburu", "dorama", "Collector"), 
        UnknownKoiProgress, 
        `Spreadsheet '${spreadsheets.invalidKoiProgress}' has koi ` +
        "'Maburu Dorama' marked with 'kk'. Expected 'k', 'd', or no text."
    );
});

test("Missing pattern name.", async() => {
    await expectErrorAsync(
        UserSpreadsheet
            .hasKoi(spreadsheets.missingPatternNames, "shishiro", "kirin", "Progressive"), 
        KoiSpreadsheetMissingPattern,
        `Error with spreadsheet '${spreadsheets.missingPatternNames}', ` +
        `sheet 'Progressives'. Expected to find a pattern name at row 23, ` +
        `column AE, but that cell is empty.`
    );
});

test("Extra empty row above a pattern.", async() => {
    await expectErrorAsync(
        UserSpreadsheet
            .hasKoi(spreadsheets.missingPatternNames, "mumura", "bukimi", "Collector"), 
        KoiSpreadsheetMissingPattern,
        `Error with spreadsheet '${spreadsheets.missingPatternNames}', ` +
        `sheet 'A-M: Collectors'. Expected to find a pattern name at row 198, ` +
        `column B, but that cell is empty.`
    );
});

test("Extra empty row in a pattern's table.", async() => {
    await expectErrorAsync(
        UserSpreadsheet
            .hasKoi(spreadsheets.missingBaseColors, "neshiro", "nezumi", "Collector"), 
        KoiSpreadsheetMissingColor,
        `Error with spreadsheet '${spreadsheets.missingBaseColors}', ` +
        `sheet 'N-Z: Collectors'. Expected to find a color name for ` +
        `pattern 'Onmyo' at row 83, column B, but that cell is empty.`
    );
});

test("Pattern missing highlight color.", async() => {
    await expectErrorAsync(
        UserSpreadsheet
            .hasKoi(spreadsheets.missingHighlightColors, "neshiro", "nezumi", "Collector"), 
        KoiSpreadsheetMissingColor,
        `Error with spreadsheet '${spreadsheets.missingHighlightColors}', ` +
        `sheet 'N-Z: Collectors'. Expected to find a color name for ` +
        `pattern 'Roru' at row 178, column D, but that cell is empty.`
    );
});

// =======================
// =====SUCCESS CALLS=====
// =======================

test("Has common koi.", async() => {
    const HAS_KOI = await UserSpreadsheet
        .hasKoi(spreadsheets.valid, "seidai", "aishite", "Collector");
    expect(HAS_KOI).toBeTruthy();
});

test("Does not have common koi.", async() => {
    const HAS_KOI = await UserSpreadsheet
        .hasKoi(spreadsheets.valid, "nekoji", "botan", "Collector");
    expect(HAS_KOI).toBeFalsy();
});

test("Has rare koi.", async() => {
    const HAS_KOI = await UserSpreadsheet
        .hasKoi(spreadsheets.valid, "mumosu", "mebaeru", "Collector");
    expect(HAS_KOI).toBeTruthy();
});

test("Does not have rare koi.", async() => {
    const HAS_KOI = await UserSpreadsheet
        .hasKoi(spreadsheets.valid, "mapinku", "naisu", "Collector");
    expect(HAS_KOI).toBeFalsy();
});

test("Has dragonned koi.", async() => {
    const HAS_KOI = await UserSpreadsheet
        .hasKoi(spreadsheets.valid2, "nekuro", "ondori", "Collector");
    expect(HAS_KOI).toBeTruthy();
});

test("Has koi even when it marked with capital K.", async() => {
    const HAS_KOI = await UserSpreadsheet
        .hasKoi(spreadsheets.badButValidKoiProgress, "shishiro", "inazuma", "Progressive");
    expect(HAS_KOI).toBeTruthy();
});

test("Has koi even when it marked with capital D.", async() => {
    const HAS_KOI = await UserSpreadsheet
        .hasKoi(spreadsheets.badButValidKoiProgress, "chakuro", "okan", "Collector");
    expect(HAS_KOI).toBeTruthy();
});

test("Has koi even when there are spaces around k.", async() => {
    const HAS_KOI = await UserSpreadsheet
        .hasKoi(spreadsheets.badButValidKoiProgress, "kudai", "akachan", "Collector");
    expect(HAS_KOI).toBeTruthy();
});

test("Has koi even when there are spaces around d.", async() => {
    const HAS_KOI = await UserSpreadsheet
        .hasKoi(spreadsheets.badButValidKoiProgress, "gudai", "oushi", "Collector");
    expect(HAS_KOI).toBeTruthy();
});

test("Does not have koi when text is just spaces.", async() => {
    const HAS_KOI = await UserSpreadsheet
        .hasKoi(spreadsheets.badButValidKoiProgress, "kipinku", "shizuku", "Progressive");
    expect(HAS_KOI).toBeFalsy();
})

test("Color is case insenstive.", async() => {
    const HAS_KOI = 
        await UserSpreadsheet.hasKoi(spreadsheets.valid, "nEDAi", "hanabi", "Collector");  
    expect(HAS_KOI).toBeTruthy();

    const HAS_KOI2 = 
        await UserSpreadsheet.hasKoi(spreadsheets.valid, "NEUSU", "hanabi", "Collector");
    expect(HAS_KOI2).toBeFalsy();
});

test("Pattern is case insenstive.", async() => {
    const HAS_KOI = 
        await UserSpreadsheet
            .hasKoi(spreadsheets.valid, "nekuro", "HYOGEN", "Collector");
    expect(HAS_KOI).toBeTruthy();

    const HAS_KOI2 = 
        await UserSpreadsheet
            .hasKoi(spreadsheets.valid, "kikatsu", "hyoGEn", "Collector");
    expect(HAS_KOI2).toBeFalsy();
});

test("Has common progressive.", async() => {
    await expect(UserSpreadsheet
        .hasKoi(spreadsheets.valid, "shishiro", "inazuma", "Progressive")
    ).resolves.toBeTruthy();

    await expect(UserSpreadsheet
        .hasKoi(spreadsheets.valid, "kukuro", "bekko", "Progressive")
    ).resolves.toBeTruthy();

    await expect(UserSpreadsheet
        .hasKoi(spreadsheets.valid, "akakuro", "ginrin", "Progressive")
    ).resolves.toBeTruthy();
});

test("Does not have common progressive.", async() => {
    await expect(UserSpreadsheet
        .hasKoi(spreadsheets.valid, "shiukon", "doitsu", "Progressive")
    ).resolves.toBeFalsy();

    await expect(UserSpreadsheet
        .hasKoi(spreadsheets.valid, "kishiro", "shapu", "Progressive")
    ).resolves.toBeFalsy();
});

test("Has rare progressive.", async() => {
    await expect(UserSpreadsheet
        .hasKoi(spreadsheets.valid, "shimura", "kimasu", "Progressive")
    ).resolves.toBeTruthy();

    await expect(UserSpreadsheet
        .hasKoi(spreadsheets.valid, "shimido", "toraiu", "Progressive")
    ).resolves.toBeTruthy();

    await expect(UserSpreadsheet
        .hasKoi(spreadsheets.valid, "kipinku", "ogon", "Progressive")
    ).resolves.toBeTruthy();
});

test("Does not have rare progressive.", async() => {
    await expect(UserSpreadsheet
        .hasKoi(spreadsheets.valid, "kumido", "kimasu", "Progressive")
    ).resolves.toBeFalsy();

    await expect(UserSpreadsheet
        .hasKoi(spreadsheets.valid, "akapinku", "kawari", "Progressive")
    ).resolves.toBeFalsy();

    await expect(UserSpreadsheet
        .hasKoi(spreadsheets.valid, "kuburu", "katame", "Progressive")
    ).resolves.toBeFalsy();
});