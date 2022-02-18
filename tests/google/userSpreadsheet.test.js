const { UserSpreadsheet, UserSpreadsheetMissingPattern, UserSpreadsheetMissingColor } = require("../../src/google/userSpreadsheet");
const ErrorMessages = require("../../src/errorMessages").default;
const { waitGoogleQuota, googleQuotaTimeout, getSpreadsheetErrorMessage, 
        testWithModifiedEnv } = require("../_setup/spreadsheet");
const { expectErrorAsync } = require("../_setup/testUtil");

// ID of test user sheet
const SPREADSHEET_ID = "1yt01AXsDvBrGpKyVETKlsgJhetUJq5eOMLx5Sf60TAU";

// wait a minute before starting the tests
// this is because google has a read quota
/*beforeAll(async() => {
    await waitGoogleQuota();
}, googleQuotaTimeout);*/

testWithModifiedEnv(
    "Has koi", 
    async () => UserSpreadsheet.hasKoi(SPREADSHEET_ID, "shigin", "aishite"),
    getSpreadsheetErrorMessage(SPREADSHEET_ID, "A-M: Collectors!B2:K")
)

test("User missing pattern.", async() => {
    let promise = UserSpreadsheet.hasKoi(SPREADSHEET_ID, "shigin", "invalidpattern");
    await expectErrorAsync(
        promise, 
        UserSpreadsheetMissingPattern, 
        `Spreadsheet '${SPREADSHEET_ID}' missing pattern 'invalidpattern'.`
    );
});

test("User missing color.", async() => {
    let promise = UserSpreadsheet.hasKoi(SPREADSHEET_ID, "invalidcolor", "natsu");
    await expectErrorAsync(
        promise, 
        UserSpreadsheetMissingColor, 
        `Spreadsheet '${SPREADSHEET_ID}' missing color 'invalidcolor' ` +
        "for pattern 'natsu'."
    );
});

test("Invalid spreadsheet.", async() => {
    let promise = UserSpreadsheet.hasKoi("invalidspreadsheet", "shigin", "natsu");
    await expectErrorAsync(
        promise, 
        UserSpreadsheetMissingColor, 
        `Spreadsheet '${SPREADSHEET_ID}' missing color 'invalidcolor' ` +
        "for pattern 'natsu'."
    );
});

test("User has common koi.", async() => {
    const HAS_KOI = await UserSpreadsheet.hasKoi(SPREADSHEET_ID)
})

/*
test("User with common collector koi.", async() => {
    const HAS_KOI = 
        await UserSpreadsheet.hasKoi(SPREADSHEET_ID, "ryomido", "akua", "Collector");
    expect(HAS_KOI).toBeTruthy();
});

test("User missing common collector koi.", async() => {
    const HAS_KOI = 
        await UserSpreadsheet.hasKoi(SPREADSHEET_ID, "budai", "akua", "Collector");
    expect(HAS_KOI).not.toBeTruthy();
});

test("User with rare collector koi.", async() => {
    const HAS_KOI = 
        await UserSpreadsheet.hasKoi(SPREADSHEET_ID, "akamura", "akua", "Collector");
    expect(HAS_KOI).toBeTruthy();
});

test("User missing rare collector koi.", async() => {
    const HAS_KOI = 
        await UserSpreadsheet.hasKoi(SPREADSHEET_ID, "akapapu", "akua", "Collector");
    expect(HAS_KOI).not.toBeTruthy();
});

// todo
/*
test("User with common progressive koi.", async() => {
    const HAS_KOI = 
        await UserSpreadsheet.hasKoi(SPREADSHEET_ID, "akadai", "inazuma", "Progressive");
    expect(HAS_KOI).toBeTruthy();
});

test("User missing common progressive koi.", async() => {
    const HAS_KOI = 
        await UserSpreadsheet.hasKoi(SPREADSHEET_ID, "kishiro", "toraiu", "Progressive");
    expect(HAS_KOI).not.toBeTruthy();
});

test("User with rare progressive koi.", async() => {
    const HAS_KOI = 
        await UserSpreadsheet.hasKoi(SPREADSHEET_ID, "akamido", "katame", "Progressive");
    expect(HAS_KOI).toBeTruthy();
});

test("User missing rare progressive koi.", async() => {
    const HAS_KOI = 
        await UserSpreadsheet.hasKoi(SPREADSHEET_ID, "kuburu", "katame", "Progressive");
    expect(HAS_KOI).not.toBeTruthy();
});*/
/*
test("User has draggoned koi", async() => {
    const HAS_KOI = 
        await UserSpreadsheet.hasKoi(SPREADSHEET_ID, "akaouka", "beta", "Collector");
    expect(HAS_KOI).toBeTruthy();
})

test("User uses capital K to mark ownership.", async() => {
    const HAS_KOI = 
        await UserSpreadsheet.hasKoi(SPREADSHEET_ID, "akadai", "beta", "Collector");
    expect(HAS_KOI).toBeTruthy();
})

test("User uses capital D to mark dragon.", async() => {
    const HAS_KOI = 
        await UserSpreadsheet.hasKoi(SPREADSHEET_ID, "madai", "beta", "Collector");
    expect(HAS_KOI).toBeTruthy();
});

test("Color is case insensitve", async() => {
    expect(await UserSpreadsheet.hasKoi(SPREADSHEET_ID, "MudAI", "mukei", "Collector"))
        .toBeTruthy();
    expect(await UserSpreadsheet.hasKoi(SPREADSHEET_ID, "MUkurO", "mukei", "Collector"))
        .not.toBeTruthy();
});

test("Pattern is case insensitve", async() => {
    expect(await UserSpreadsheet.hasKoi(SPREADSHEET_ID, "mudai", "MukEi", "Collector"))
        .toBeTruthy();
    expect(await UserSpreadsheet.hasKoi(SPREADSHEET_ID, "mukuro", "MukEi", "Collector"))
        .not.toBeTruthy();
});

test("Color accents in spreadsheet are ignored.", async() => {
    expect(await UserSpreadsheet.hasKoi(SPREADSHEET_ID, "chakoji", "mukei", "Collector"))
        .toBeTruthy();
    expect(await UserSpreadsheet.hasKoi(SPREADSHEET_ID, "makoji", "mukei", "Collector"))
        .not.toBeTruthy();
});

test("User with collector koi starting with letter n.", async() => {
    const HAS_KOI = 
        await UserSpreadsheet.hasKoi(SPREADSHEET_ID, "mamido", "naisu", "Collector");
    expect(HAS_KOI).toBeTruthy();
});

test(
    "Can get whether user has koi even if the highlight color is missing a " +
    "dash in the spreadsheet.", 
    async() => 
{
    expect(await UserSpreadsheet.hasKoi(SPREADSHEET_ID, "ryomosu", "rakki", "Collector"))
        .toBeTruthy();
    expect(await UserSpreadsheet.hasKoi(SPREADSHEET_ID, "mamosu", "rakki", "Collector"))
        .not.toBeTruthy();
});

test(
    "Can get whether user has koi even if the base color is missing a " +
    "dash in the spreadsheet.", 
    async() => 
{
    expect(await UserSpreadsheet.hasKoi(SPREADSHEET_ID, "gushiro", "rakki", "Collector"))
        .toBeTruthy();
    expect(await UserSpreadsheet.hasKoi(SPREADSHEET_ID, "guukon", "rakki", "Collector"))
        .not.toBeTruthy();
});

test("Error getting whether the user has a koi of a non existant pattern.", async () => {
    await expect(
        UserSpreadsheet.hasKoi(SPREADSHEET_ID, "gushiro", "fakepattern", "Collector")
    ).rejects.toThrow(ErrorMessages.USER_SPREADSHEET.PATTERN_DOES_NOT_EXIST);
});

test("Error getting whether the user has a koi of a non existant color.", async () => {
    await expect(
        UserSpreadsheet.hasKoi(SPREADSHEET_ID, "fakecolor", "rozu", "Collector")
    ).rejects.toThrow(ErrorMessages.USER_SPREADSHEET.COLOR_DOES_NOT_EXIST);
});

test(
    "Error getting whether the user has a koi of a color that does not exist, " +
    "but has a valid base and highlight color.", 
    async () => 
{
    await expect(
        UserSpreadsheet.hasKoi(SPREADSHEET_ID, "nefakeshiro", "rozu", "Collector")
    ).rejects.toThrow(ErrorMessages.USER_SPREADSHEET.COLOR_DOES_NOT_EXIST);
});

test(
    "Error getting whether the user has a koi when the spreadsheet ID is invalid.",
    async() => 
{
    await expect(
        UserSpreadsheet.hasKoi("bad ID", "neshiro", "rozu", "Collector")
    ).rejects.toThrow(ErrorMessages.SPREADSHEET.CANNOT_GET_SPREADSHEET);
});*/