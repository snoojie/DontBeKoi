const { UserSpreadsheet, UserSpreadsheetMissingKoi, UserSpreadsheetMissingPattern }
    = require("../../src/google/userSpreadsheet");
const { waitGoogleQuota, googleQuotaTimeout, testWithModifiedEnv, spreadsheets, 
        expectSpreadsheetError, expectPrivateSpreadsheet, expectRangeNotFound, 
        expectUnknownKoiProgress, expectKoiSpreadsheetMissingPattern, 
        expectKoiSpreadsheetMissingColor, expectSpreadsheetNotFound } 
    = require("../_setup/spreadsheet");

// wait a minute before starting the tests
// this is because google has a read quota
beforeAll(async() => {
    //await waitGoogleQuota();
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
    await expectMissingPattern(
        spreadsheets.valid, "shigin", "invalidpattern", "Collector"
    );
});

test("User missing base color.", async() => {
    await expectMissingKoi(
        spreadsheets.valid, "invalicolor", "natsu", "Collector"
    );
});

test("User missing highlight color.", async() => {
    await expectMissingKoi(
        spreadsheets.valid, "neinvalid", "robotto", "Collector"
    );
});

test("User missing color even though base and highlight are correct.", async() => {
    await expectMissingKoi(
        spreadsheets.valid, "seiinvalidkoji", "toransu", "Collector"
    );
});

test("Spreadsheet does not exist.", async() => {
    await expectSpreadsheetNotFound(
        UserSpreadsheet.hasKoi("invalidspreadsheet", "shigin", "natsu", "Collector"), 
        "invalidspreadsheet"
    );
});

test("Private spreadsheet.", async() => {
    await expectPrivateSpreadsheet(
        UserSpreadsheet.hasKoi(
            spreadsheets.private, "shigin", "natsu", "Collector"
        )
    );
});

test("Spreadsheet with renamed sheets.", async() => {
    await expectRangeNotFound(
        UserSpreadsheet.hasKoi(
            spreadsheets.renamedSheets, "mapapu", "aishite", "Collector"
        ), 
        spreadsheets.renamedSheets,
        "A-M: Collectors!B2:K"
    );
});

test("Koi marked with neither k or d.", async() => {
    await expectUnknownKoiProgress(
        UserSpreadsheet
            .hasKoi(spreadsheets.invalidKoiProgress, "maburu", "dorama", "Collector"), 
        spreadsheets.invalidKoiProgress,
        "Collector",
        "Maburu",
        "Dorama",
        "kk"
    );
});

test("Missing pattern name.", async() => {
    await expectKoiSpreadsheetMissingPattern(
        UserSpreadsheet
            .hasKoi(spreadsheets.missingPatternNames, "shishiro", "kirin", "Progressive"), 
        spreadsheets.missingPatternNames,
        "Progressives",
        23,
        "AE"
    );
});

test("Extra empty row above a pattern.", async() => {
    await expectKoiSpreadsheetMissingPattern(
        UserSpreadsheet
            .hasKoi(spreadsheets.missingPatternNames, "mumura", "bukimi", "Collector"), 
        spreadsheets.missingPatternNames,
        "A-M: Collectors",
        198,
        "B"
    );
});

test("Extra empty row in a pattern's table.", async() => {
    await expectKoiSpreadsheetMissingColor(
        UserSpreadsheet
            .hasKoi(spreadsheets.missingBaseColors, "neshiro", "nezumi", "Collector"), 
        spreadsheets.missingBaseColors,
        "Collector",
        "Onmyo",
        83,
        "B"
    );
});

test("Pattern missing highlight color.", async() => {
    await expectKoiSpreadsheetMissingColor(
        UserSpreadsheet
            .hasKoi(spreadsheets.missingHighlightColors, "neshiro", "nezumi", "Collector"), 
        spreadsheets.missingHighlightColors,
        "Collector",
        "Roru",
        178,
        "D"
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


async function expectMissingPattern(spreadsheetId, koi, pattern, type)
{
    await expectSpreadsheetError(
        UserSpreadsheet.hasKoi(spreadsheetId, koi, pattern, type),
        UserSpreadsheetMissingPattern, 
        spreadsheetId,
        `missing ${type.toLowerCase()} ${pattern}`
    );
}

async function expectMissingKoi(spreadsheetId, koi, pattern, type)
{
    await expectSpreadsheetError(
        UserSpreadsheet.hasKoi(spreadsheetId, koi, pattern, type),
        UserSpreadsheetMissingKoi, 
        spreadsheetId,
        `missing koi ${koi} for ${type.toLowerCase()} ${pattern}`
    );
}