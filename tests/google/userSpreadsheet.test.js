const UserSpreadsheet = require("../../src/google/userSpreadsheet").default;
const ErrorMessages = require("../../src/errorMessages").default;

// ID of test user sheet
const SPREADSHEET_ID = "1yt01AXsDvBrGpKyVETKlsgJhetUJq5eOMLx5Sf60TAU";


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
    await expect(UserSpreadsheet.hasKoi(SPREADSHEET_ID, "MudAI", "mukei", "Collector"))
        .toBeTruthy();
    await expect(UserSpreadsheet.hasKoi(SPREADSHEET_ID, "MUkurO", "mukei", "Collector"))
        not.toBeTruthy();
});

test("Pattern is case insensitve", async() => {
    await expect(UserSpreadsheet.hasKoi(SPREADSHEET_ID, "mudai", "MukEi", "Collector"))
        .toBeTruthy();
    await expect(UserSpreadsheet.hasKoi(SPREADSHEET_ID, "mukuro", "MukEi", "Collector"))
        .not.toBeTruthy();
});

test("Accents are ignored.", async() => {
    await expect(UserSpreadsheet.hasKoi(SPREADSHEET_ID, "chakoji", "mukei", "Collector"))
        .toBeTruthy();
    await expect(UserSpreadsheet.hasKoi(SPREADSHEET_ID, "makoji", "mukei", "Collector"))
        not.toBeTruthy();
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
    await expect(UserSpreadsheet.hasKoi(SPREADSHEET_ID, "ryomosu", "rakki", "Collector"))
        .toBeTruthy();
    await expect(UserSpreadsheet.hasKoi(SPREADSHEET_ID, "mamosu", "rakki", "Collector"))
        .toBeTruthy();
});

test(
    "Can get whether user has koi even if the base color is missing a " +
    "dash in the spreadsheet.", 
    async() => 
{
    await expect(UserSpreadsheet.hasKoi(SPREADSHEET_ID, "gushiro", "rakki", "Collector"))
        .toBeTruthy();
    await expect(UserSpreadsheet.hasKoi(SPREADSHEET_ID, "guukon", "rakki", "Collector"))
        .toBeTruthy();
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
        UserSpreadsheet.hasKoi(SPREADSHEET_ID, "nefakeshiro", "rozu", "Collector")
    ).rejects.toThrow(ErrorMessages.USER_SPREADSHEET.CANNOT_GET_SPREADSHEET);
});*/