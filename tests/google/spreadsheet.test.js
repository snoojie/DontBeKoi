const Spreadsheet = require("../../src/google/spreadsheet").default;
const ErrorMessages = require("../../src/errorMessages").default;

// this is the community spreadsheet
const VALID_SPREADSHEET_ID = "1Y717KMb15npzEv3ed2Ln2Ua0ZXejBHyfbk5XL_aZ4Qo";

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

    test("Error validating valid spreadsheet ID without a google API key.", async() => {
        await expect(Spreadsheet.validateId(VALID_SPREADSHEET_ID))
            .rejects.toThrow(ErrorMessages.CONFIG.MISSING_ENVIRONMENT_VARIABLE);
    });
    
    test("Error validating invalid spreadsheet ID without a google API key.", async() => {
        await expect(Spreadsheet.validateId("fakeid"))
            .rejects.toThrow(ErrorMessages.CONFIG.MISSING_ENVIRONMENT_VARIABLE);
    });

    test("Error validating valid spreadsheet ID with an incorrect google API key.", async() => {
        process.env.GOOGLE_API_KEY = "fakekey";
        await expect(Spreadsheet.validateId(VALID_SPREADSHEET_ID))
            .rejects.toThrow(ErrorMessages.SPREADSHEET.INVALID_GOOGLE_API_KEY);
    });

    test("Error validating invalid spreadsheet ID with an incorrect google API key.", async() => {
        process.env.GOOGLE_API_KEY = "fakekey";
        await expect(Spreadsheet.validateId("fakeid"))
            .rejects.toThrow(ErrorMessages.SPREADSHEET.INVALID_GOOGLE_API_KEY);
    });

});