const Spreadsheet = require("../../src/google/spreadsheet").default;
const ErrorMessages = require("../../src/errorMessages").default;

// this is the community spreadsheet
const VALID_SPREADSHEET_ID = "1Y717KMb15npzEv3ed2Ln2Ua0ZXejBHyfbk5XL_aZ4Qo";
const VALID_RANGE = "Progressives!I2:K4";

const ORIGINAL_ENV = process.env;

// ==============================
// =====VALIDATE SPREADSHEET=====
// ==============================

test("Validating valid spreadsheet ID returns true.", async() => {
    let isValid = await Spreadsheet.validateId(VALID_SPREADSHEET_ID);
    expect(isValid).toBeTruthy();
});

test("Validating invalid spreadsheet ID returns false.", async() => {
    let isValid = await Spreadsheet.validateId("fakeid");
    expect(isValid).not.toBeTruthy();
});

describe("Modify google API key.", () => {

    // remove google API key for each test
    beforeEach(() => {
        process.env = { ...ORIGINAL_ENV };
        delete process.env.GOOGLE_API_KEY;
    });
    afterAll(() => process.env = ORIGINAL_ENV);

    test("Error validating valid spreadsheet without a Google API key.", async() => 
    {
        await expect(Spreadsheet.validateId(VALID_SPREADSHEET_ID))
            .rejects.toThrow(ErrorMessages.CONFIG.MISSING_ENVIRONMENT_VARIABLE);
    });

    test(
        "Error validating valid spreadsheet ID with an incorrect google API key.", 
        async() => 
    {
        process.env.GOOGLE_API_KEY = "fakekey";
        await expect(Spreadsheet.validateId(VALID_SPREADSHEET_ID))
            .rejects.toThrow(ErrorMessages.SPREADSHEET.INVALID_GOOGLE_API_KEY);
    });

// ====================
// =====GET VALUES=====
// ====================

    test(
        "Error getting values without a Google API key even with valid spreadsheet " + 
        "ID and range.", 
        async() => 
    {
        await expect(Spreadsheet.getValues(VALID_SPREADSHEET_ID, VALID_RANGE))
            .rejects.toThrow(ErrorMessages.CONFIG.MISSING_ENVIRONMENT_VARIABLE);
    });

    test("Error getting values with an invalid Google API key even with valid spreadsheet ID and range.", async() => 
    {
        process.env.GOOGLE_API_KEY = "fake";
        await expect(Spreadsheet.getValues(VALID_SPREADSHEET_ID, VALID_RANGE))
            .rejects.toThrow(ErrorMessages.SPREADSHEET.CANNOT_GET_SPREADSHEET);
    });

});

test("Error getting values of invalid spreadsheet.", async() => {
    await expect(Spreadsheet.getValues("fakeid", "fakerange"))
        .rejects.toThrow(ErrorMessages.SPREADSHEET.CANNOT_GET_SPREADSHEET);
});

test("Error getting values of invalid range.", async() => {
    await expect(Spreadsheet.getValues(VALID_SPREADSHEET_ID, "fakerange"))
        .rejects.toThrow(ErrorMessages.SPREADSHEET.CANNOT_GET_SPREADSHEET);
});

test("Can get all values of rows with text.", async() => {
    const VALUES = await Spreadsheet.getValues(VALID_SPREADSHEET_ID, VALID_RANGE);
    expect(VALUES).toStrictEqual([
        ["Inazuma"],
        ["", "-shiro", "-ukon"],
        ["Shi-"]
    ]);
});

test("Getting values where first row has no text includes that empty row.", async() => {
    const VALUES = 
        await Spreadsheet.getValues(VALID_SPREADSHEET_ID, "Progressives!L2:M3");
    expect(VALUES).toStrictEqual([
        [],
        ["-dai", "-kuro"]
    ]);
});

test("Getting values where last row has no text excludes that last row.", async() => {
    const VALUES = 
        await Spreadsheet.getValues(VALID_SPREADSHEET_ID, "Progressives!K3:L4");
    expect(VALUES).toStrictEqual([
        ["-ukon", "-dai"]
    ]);
});

test("Getting values when there is no text returns an empty list.", async() => {
    const VALUES = 
        await Spreadsheet.getValues(VALID_SPREADSHEET_ID, "Progressives!K4:L5");
    expect(VALUES).toStrictEqual([]);
});

test("Can get value of one cell, with text, with range !<cell>:<cell>.", async() => {
    const VALUES = 
        await Spreadsheet.getValues(VALID_SPREADSHEET_ID, "Progressives!I2:I2");
    expect(VALUES).toStrictEqual([["Inazuma"]]);
});

test("Can get value of one cell, with text, with range !<cell>.", async() => {
    const VALUES = await Spreadsheet.getValues(VALID_SPREADSHEET_ID, "Progressives!I2");
    expect(VALUES).toStrictEqual([["Inazuma"]]);
});

test(
    "Getting value of one cell, without text, with range !<cell>:<cell>, returns " +
    "an empty list.", 
    async() => 
{
    const VALUES = await Spreadsheet.getValues(VALID_SPREADSHEET_ID, "Progressives!L5:L5");
    expect(VALUES).toStrictEqual([]);
});

test(
    "Getting value of one cell, without text, with range !<cell>, " + 
    "returns an empty list.", 
    async() => 
{
    const VALUES = await Spreadsheet.getValues(VALID_SPREADSHEET_ID, "Progressives!J2");
    expect(VALUES).toStrictEqual([]);
});