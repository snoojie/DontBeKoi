const { SpreadsheetNotFound, PrivateSpreadsheet } = require("../../src/google/spreadsheet");
const { UserSpreadsheet, PatternNotFound, KoiNotFound,
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
    async () => UserSpreadsheet.hasKoi(spreadsheets.test, "shigin", "aishite")
)

test("User missing pattern.", async() => {
    await expectErrorAsync(
        UserSpreadsheet.hasKoi(spreadsheets.test, "shigin", "invalidpattern"), 
        PatternNotFound, 
        `Spreadsheet '${spreadsheets.test}' missing pattern 'invalidpattern'.`
    );
});

test("User missing base color.", async() => {
    await expectErrorAsync(
        UserSpreadsheet.hasKoi(spreadsheets.test, "invalidcolor", "natsu"), 
        KoiNotFound, 
        `Spreadsheet '${spreadsheets.test}' missing koi 'invalidcolor' ` +
        "for pattern 'natsu'."
    );
});

test("User missing highlight color.", async() => {
    await expectErrorAsync(
        UserSpreadsheet.hasKoi(spreadsheets.test, "neinvalid", "robotto"), 
        KoiNotFound, 
        `Spreadsheet '${spreadsheets.test}' missing koi 'neinvalid' ` +
        "for pattern 'robotto'."
    );
});

test("User missing color even though base and highlight are correct.", async() => {
    await expectErrorAsync(
        UserSpreadsheet.hasKoi(spreadsheets.test, "seiinvalidkoji", "toransu"), 
        KoiNotFound,
        `Spreadsheet '${spreadsheets.test}' missing koi 'seiinvalidkoji' ` +
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

test("Koi marked with neither k or d, ignoring casing or whitespaces.", async() => {
    await expectErrorAsync(
        UserSpreadsheet.hasKoi(spreadsheets.test, "neburu", "jueru"), 
        UnknownKoiProgress, 
        `Spreadsheet '${spreadsheets.test}' has koi 'neburu jueru' marked ` +
        `with 'invalid'. Expected to see 'k', 'd', or no text.`
    );
});

// =======================
// =====SUCCESS CALLS=====
// =======================

test("Has common koi.", async() => {
    const HAS_KOI = await UserSpreadsheet.hasKoi(spreadsheets.test, "seidai", "aishite");
    expect(HAS_KOI).toBeTruthy();
});

test("Does not have common koi.", async() => {
    const HAS_KOI = await UserSpreadsheet.hasKoi(spreadsheets.test, "nekoji", "botan");
    expect(HAS_KOI).toBeFalsy();
});

test("Has rare koi.", async() => {
    const HAS_KOI = await UserSpreadsheet.hasKoi(spreadsheets.test, "mausu", "mukei");
    expect(HAS_KOI).toBeTruthy();
});

test("Does not have rare koi.", async() => {
    const HAS_KOI = await UserSpreadsheet.hasKoi(spreadsheets.test, "mapinku", "naisu");
    expect(HAS_KOI).toBeFalsy();
});

test("Has dragonned koi.", async() => {
    const HAS_KOI = await UserSpreadsheet.hasKoi(spreadsheets.test, "buusu", "seiza");
    expect(HAS_KOI).toBeTruthy();
});

test("Has koi even when it marked with capital K.", async() => {
    const HAS_KOI = await UserSpreadsheet.hasKoi(spreadsheets.test, "chomura", "yumi");
    expect(HAS_KOI).toBeTruthy();
});

test("Has koi even when it marked with capital D.", async() => {
    const HAS_KOI = await UserSpreadsheet.hasKoi(spreadsheets.test, "gumido", "yumi");
    expect(HAS_KOI).toBeTruthy();
});

test("Has koi even when there are spaces around k.", async() => {
    const HAS_KOI = await UserSpreadsheet.hasKoi(spreadsheets.test, "mugure", "suneku");
    expect(HAS_KOI).toBeTruthy();
});

test("Has koi even when there are spaces around d.", async() => {
    const HAS_KOI = await UserSpreadsheet.hasKoi(spreadsheets.test, "negure", "suneku");
    expect(HAS_KOI).toBeTruthy();
});

test("Color is case insenstive.", async() => {
    const HAS_KOI = 
        await UserSpreadsheet.hasKoi(spreadsheets.test, "AkabUru", "hitsuji");  
    expect(HAS_KOI).toBeTruthy();

    const HAS_KOI2 = 
        await UserSpreadsheet.hasKoi(spreadsheets.test, "OreburU", "hitsuji");
    expect(HAS_KOI2).toBeFalsy();
});

test("Pattern is case insenstive.", async() => {
    const HAS_KOI = 
        await UserSpreadsheet.hasKoi(spreadsheets.test, "akaburu", "HItsuji");
    expect(HAS_KOI).toBeTruthy();

    const HAS_KOI2 = 
        await UserSpreadsheet.hasKoi(spreadsheets.test, "oreburu", "hitsuJi");
    expect(HAS_KOI2).toBeFalsy();
});