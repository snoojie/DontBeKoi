const { InvalidSpreadsheet } = require("../../src/google/spreadsheet");
const { UserSpreadsheet, PatternNotInSpreadsheet, KoiNotInSpreadsheet, UnexpectedKoiMark, PrivateSpreadsheet } 
    = require("../../src/google/userSpreadsheet");
const { waitGoogleQuota, googleQuotaTimeout, testWithModifiedEnv } 
    = require("../_setup/spreadsheet");
const { expectErrorAsync } = require("../_setup/testUtil");

// ID of test user sheet
const SPREADSHEET_ID = "1yt01AXsDvBrGpKyVETKlsgJhetUJq5eOMLx5Sf60TAU";

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
    async () => UserSpreadsheet.hasKoi(SPREADSHEET_ID, "shigin", "aishite")
)

test("User missing pattern.", async() => {
    await expectErrorAsync(
        UserSpreadsheet.hasKoi(SPREADSHEET_ID, "shigin", "invalidpattern"), 
        PatternNotInSpreadsheet, 
        `Spreadsheet '${SPREADSHEET_ID}' missing pattern 'invalidpattern'.`
    );
});

test("User missing base color.", async() => {
    await expectErrorAsync(
        UserSpreadsheet.hasKoi(SPREADSHEET_ID, "invalidcolor", "natsu"), 
        KoiNotInSpreadsheet, 
        `Spreadsheet '${SPREADSHEET_ID}' missing color 'invalidcolor' ` +
        "for pattern 'natsu'."
    );
});

test("User missing highlight color.", async() => {
    await expectErrorAsync(
        UserSpreadsheet.hasKoi(SPREADSHEET_ID, "neinvalid", "robotto"), 
        KoiNotInSpreadsheet, 
        `Spreadsheet '${SPREADSHEET_ID}' missing color 'neinvalid' ` +
        "for pattern 'robotto'."
    );
});

test("User missing color even though base and highlight are correct.", async() => {
    await expectErrorAsync(
        UserSpreadsheet.hasKoi(SPREADSHEET_ID, "seiinvalidkoji", "toransu"), 
        KoiNotInSpreadsheet, 
        `Spreadsheet '${SPREADSHEET_ID}' missing color 'seiinvalidkoji' ` +
        "for pattern 'toransu'."
    );
});

test("Invalid spreadsheet.", async() => {
    await expectErrorAsync(
        UserSpreadsheet.hasKoi("invalidspreadsheet", "shigin", "natsu"), 
        InvalidSpreadsheet, 
        "Spreadsheet ID 'invalidspreadsheet' does not exist."
    );
});

test("Private spreadsheet.", async() => {
    await expectErrorAsync(
        UserSpreadsheet.hasKoi(
            "1bh3vHHqypdig1C1JAM95LYwvw0onkZ0k12jq0y4YYN8", "shigin", "natsu"
        ), 
        PrivateSpreadsheet, 
        "Could not read from spreadsheet " +
        "'1bh3vHHqypdig1C1JAM95LYwvw0onkZ0k12jq0y4YYN8'. Can anyone with a link read it?"
    );
});

test("Koi marked with neither k or d, ignoring casing or whitespaces.", async() => {
    await expectErrorAsync(
        UserSpreadsheet.hasKoi(SPREADSHEET_ID, "neburu", "jueru"), 
        UnexpectedKoiMark, 
        `Spreadsheet '${SPREADSHEET_ID}' has koi 'neburu jueru' marked ` +
        `with 'invalid'. Expected to see 'k', 'd', or no text.`
    );
});

// =======================
// =====SUCCESS CALLS=====
// =======================

test("Has common koi.", async() => {
    const HAS_KOI = await UserSpreadsheet.hasKoi(SPREADSHEET_ID, "seidai", "aishite");
    expect(HAS_KOI).toBeTruthy();
});

test("Does not have common koi.", async() => {
    const HAS_KOI = await UserSpreadsheet.hasKoi(SPREADSHEET_ID, "nekoji", "botan");
    expect(HAS_KOI).toBeFalsy();
});

test("Has rare koi.", async() => {
    const HAS_KOI = await UserSpreadsheet.hasKoi(SPREADSHEET_ID, "mausu", "mukei");
    expect(HAS_KOI).toBeTruthy();
});

test("Does not have rare koi.", async() => {
    const HAS_KOI = await UserSpreadsheet.hasKoi(SPREADSHEET_ID, "mapinku", "naisu");
    expect(HAS_KOI).toBeFalsy();
});

test("Has dragonned koi.", async() => {
    const HAS_KOI = await UserSpreadsheet.hasKoi(SPREADSHEET_ID, "buusu", "seiza");
    expect(HAS_KOI).toBeTruthy();
});

test("Has koi even when it marked with capital K.", async() => {
    const HAS_KOI = await UserSpreadsheet.hasKoi(SPREADSHEET_ID, "chomura", "yumi");
    expect(HAS_KOI).toBeTruthy();
});

test("Has koi even when it marked with capital D.", async() => {
    const HAS_KOI = await UserSpreadsheet.hasKoi(SPREADSHEET_ID, "gumido", "yumi");
    expect(HAS_KOI).toBeTruthy();
});

test("Has koi even when there are spaces around k.", async() => {
    const HAS_KOI = await UserSpreadsheet.hasKoi(SPREADSHEET_ID, "mugure", "suneku");
    expect(HAS_KOI).toBeTruthy();
});

test("Has koi even when there are spaces around d.", async() => {
    const HAS_KOI = await UserSpreadsheet.hasKoi(SPREADSHEET_ID, "negure", "suneku");
    expect(HAS_KOI).toBeTruthy();
});

test("Color is case insenstive.", async() => {
    const HAS_KOI = await UserSpreadsheet.hasKoi(SPREADSHEET_ID, "AkabUru", "hitsuji");
    expect(HAS_KOI).toBeTruthy();

    const HAS_KOI2 = await UserSpreadsheet.hasKoi(SPREADSHEET_ID, "OreburU", "hitsuji");
    expect(HAS_KOI2).toBeFalsy();
});

test("Pattern is case insenstive.", async() => {
    const HAS_KOI = await UserSpreadsheet.hasKoi(SPREADSHEET_ID, "akaburu", "HItsuji");
    expect(HAS_KOI).toBeTruthy();

    const HAS_KOI2 = await UserSpreadsheet.hasKoi(SPREADSHEET_ID, "oreburu", "hitsuJi");
    expect(HAS_KOI2).toBeFalsy();
});