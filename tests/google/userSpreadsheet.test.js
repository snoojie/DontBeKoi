const UserSpreadsheet = require("../../src/google/userSpreadsheet").default;
const ErrorMessages = require("../../src/errorMessages").default;

// ID of test user sheet
const SPREADSHEET_ID = "1yt01AXsDvBrGpKyVETKlsgJhetUJq5eOMLx5Sf60TAU";

// todo
// these are prelimary tests. they have not yet been run

test("User with common collector koi.", async() => {
    const HAS_KOI = await UserSpreadsheet.hasKoi(SPREADSHEET_ID, "ryomido", "akua");
    expect(HAS_KOI).toBeTruthy();
});

test("User missing common collector koi.", async() => {
    const HAS_KOI = await UserSpreadsheet.hasKoi(SPREADSHEET_ID, "budai", "akua");
    expect(HAS_KOI).not.toBeTruthy();
});

test("User with rare collector koi.", async() => {
    const HAS_KOI = await UserSpreadsheet.hasKoi(SPREADSHEET_ID, "akamura", "akua");
    expect(HAS_KOI).toBeTruthy();
});

test("User missing rare collector koi.", async() => {
    const HAS_KOI = await UserSpreadsheet.hasKoi(SPREADSHEET_ID, "akapapu", "akua");
    expect(HAS_KOI).not.toBeTruthy();
});

test("User with common progressive koi.", async() => {
    const HAS_KOI = await UserSpreadsheet.hasKoi(SPREADSHEET_ID, "akadai", "inazuma");
    expect(HAS_KOI).toBeTruthy();
});

test("User missing common progressive koi.", async() => {
    const HAS_KOI = await UserSpreadsheet.hasKoi(SPREADSHEET_ID, "kishiro", "toraiu");
    expect(HAS_KOI).not.toBeTruthy();
});

test("User with rare progressive koi.", async() => {
    const HAS_KOI = await UserSpreadsheet.hasKoi(SPREADSHEET_ID, "akamido", "katame");
    expect(HAS_KOI).toBeTruthy();
});

test("User missing rare progressive koi.", async() => {
    const HAS_KOI = await UserSpreadsheet.hasKoi(SPREADSHEET_ID, "kuburu", "katame");
    expect(HAS_KOI).not.toBeTruthy();
});

test("User has draggoned koi", async() => {
    const HAS_KOI = await UserSpreadsheet.hasKoi(SPREADSHEET_ID, "akaouka", "beta");
    expect(HAS_KOI).toBeTruthy();
})

test("User uses capital K to mark ownership.", async() => {
    const HAS_KOI = await UserSpreadsheet.hasKoi(SPREADSHEET_ID, "akadai", "beta");
    expect(HAS_KOI).toBeTruthy();
})

test("User uses capital D to mark dragon.", async() => {
    const HAS_KOI = await UserSpreadsheet.hasKoi(SPREADSHEET_ID, "madai", "beta");
    expect(HAS_KOI).toBeTruthy();
});

test("Color is case insensitve", async() => {
    await expect(UserSpreadsheet.hasKoi(SPREADSHEET_ID, "MudAI", "mukei"))
        .toBeTruthy();
    await expect(UserSpreadsheet.hasKoi(SPREADSHEET_ID, "MUkurO", "mukei"))
        not.toBeTruthy();
});

test("Pattern is case insensitve", async() => {
    await expect(UserSpreadsheet.hasKoi(SPREADSHEET_ID, "mudai", "MukEi"))
        .toBeTruthy();
    await expect(UserSpreadsheet.hasKoi(SPREADSHEET_ID, "mukuro", "MukEi"))
        .not.toBeTruthy();
});

test("Accents are ignored.", async() => {
    await expect(UserSpreadsheet.hasKoi(SPREADSHEET_ID, "chakoji", "mukei"))
        .toBeTruthy();
    await expect(UserSpreadsheet.hasKoi(SPREADSHEET_ID, "makoji", "mukei"))
        not.toBeTruthy();
});

test("User with collector koi starting with letter n.", async() => {
    const HAS_KOI = await UserSpreadsheet.hasKoi(SPREADSHEET_ID, "mamido", "naisu");
    expect(HAS_KOI).toBeTruthy();
});

test(
    "Can get whether user has koi even if the highlight color is missing a " +
    "dash in the spreadsheet.", 
    async() => 
{
    await expect(UserSpreadsheet.hasKoi(SPREADSHEET_ID, "ryomosu", "rakki"))
        .toBeTruthy();
    await expect(UserSpreadsheet.hasKoi(SPREADSHEET_ID, "mamosu", "rakki"))
        .toBeTruthy();
});

test(
    "Can get whether user has koi even if the base color is missing a " +
    "dash in the spreadsheet.", 
    async() => 
{
    await expect(UserSpreadsheet.hasKoi(SPREADSHEET_ID, "gushiro", "rakki"))
        .toBeTruthy();
    await expect(UserSpreadsheet.hasKoi(SPREADSHEET_ID, "guukon", "rakki"))
        .toBeTruthy();
});

test("Error getting whether the user has a koi of a non existant pattern.", async () => {
    await expect(UserSpreadsheet.hasKoi(SPREADSHEET_ID, "gushiro", "fakepattern"))
        .rejects.toThrow(ErrorMessages.USER_SPREADSHEET.PATTERN_DOES_NOT_EXIST);
});

test("Error getting whether the user has a koi of a non existant color.", async () => {
    await expect(UserSpreadsheet.hasKoi(SPREADSHEET_ID, "fakecolor", "rozu"))
        .rejects.toThrow(ErrorMessages.USER_SPREADSHEET.COLOR_DOES_NOT_EXIST);
});

test(
    "Error getting whether the user has a koi of a color that does not exist, " +
    "but has a valid base and highlight color.", 
    async () => 
{
    await expect(UserSpreadsheet.hasKoi(SPREADSHEET_ID, "nefakeshiro", "rozu"))
        .rejects.toThrow(ErrorMessages.USER_SPREADSHEET.COLOR_DOES_NOT_EXIST);
});

test(
    "Error getting whether the user has a koi when the spreadsheet ID is invalid.",
    async() => 
{
    await expect(UserSpreadsheet.hasKoi(SPREADSHEET_ID, "nefakeshiro", "rozu"))
        .rejects.toThrow(ErrorMessages.USER_SPREADSHEET.CANNOT_GET_SPREADSHEET);
});